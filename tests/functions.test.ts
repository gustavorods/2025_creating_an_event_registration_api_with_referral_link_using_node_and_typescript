import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  where: vi.fn(), returning: vi.fn(), values: vi.fn(), select: vi.fn(), insert: vi.fn(),
  redis: { hincrby: vi.fn(), hget: vi.fn(), zscore: vi.fn(), zrevrank: vi.fn(), zrevrange: vi.fn(), zincrby: vi.fn() },
}))
vi.mock('../src/drizzle/client', () => ({ db: { select: mocks.select, insert: mocks.insert } }))
vi.mock('../src/redis/client', () => ({ redis: mocks.redis }))

import { subscribeToEvent } from '../src/functions/subscribe-to-event'
import { accessInviteLink } from '../src/functions/access-invite-link'
import { getSubscriberInviteClicks } from '../src/functions/get-subscriber-invite-clicks'
import { getSubscriberInvitesCount } from '../src/functions/get-subscriber-invites-count'
import { getSubscriberRankingPosition } from '../src/functions/get-subscriber-ranking-position'
import { getRanking } from '../src/functions/get-ranking'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) })
  mocks.insert.mockReturnValue({ values: mocks.values })
  mocks.values.mockReturnValue({ returning: mocks.returning })
  mocks.where.mockResolvedValue([])
  mocks.returning.mockResolvedValue([{ id: 'new-id' }])
})

describe('inscrições', () => {
  const input = { name: 'Ana', email: 'ana@example.com' }
  it('cria uma inscrição sem pontuar quando não há indicação', async () => {
    expect(await subscribeToEvent(input)).toEqual({ subscriberId: 'new-id' })
    expect(mocks.values).toHaveBeenCalledWith(input)
    expect(mocks.redis.zincrby).not.toHaveBeenCalled()
  })
  it('pontua o indicador de uma nova inscrição', async () => {
    await subscribeToEvent({ ...input, referrerId: 'friend-id' })
    expect(mocks.redis.zincrby).toHaveBeenCalledExactlyOnceWith('referral:ranking', 1, 'friend-id')
  })
  it('recupera o ID existente sem reinserir ou pontuar novamente', async () => {
    mocks.where.mockResolvedValue([{ id: 'existing-id' }])
    expect(await subscribeToEvent({ ...input, referrerId: 'friend-id' })).toEqual({ subscriberId: 'existing-id' })
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.redis.zincrby).not.toHaveBeenCalled()
  })
  it('não pontua uma inscrição cuja persistência falhou', async () => {
    mocks.returning.mockRejectedValue(new Error('database unavailable'))
    await expect(subscribeToEvent({ ...input, referrerId: 'friend-id' })).rejects.toThrow('database unavailable')
    expect(mocks.redis.zincrby).not.toHaveBeenCalled()
  })
})

describe('métricas de indicação', () => {
  const input = { subscriberId: 'ana-id' }
  it('registra cada acesso ao convite', async () => {
    await accessInviteLink(input)
    expect(mocks.redis.hincrby).toHaveBeenCalledExactlyOnceWith('referral:access-count', 'ana-id', 1)
  })
  it.each([null, '0', '12'])('converte acessos %s em contagem numérica', async value => {
    mocks.redis.hget.mockResolvedValue(value)
    expect(await getSubscriberInviteClicks(input)).toEqual({ count: Number(value) })
    expect(mocks.redis.hget).toHaveBeenCalledWith('referral:access-count', 'ana-id')
  })
  it.each([null, '0', '7'])('converte indicações %s em contagem numérica', async value => {
    mocks.redis.zscore.mockResolvedValue(value)
    expect(await getSubscriberInvitesCount(input)).toEqual({ count: Number(value) })
    expect(mocks.redis.zscore).toHaveBeenCalledWith('referral:ranking', 'ana-id')
  })
  it.each([[null, null], [0, 1], [4, 5]])('converte índice %s em posição %s', async (rank, position) => {
    mocks.redis.zrevrank.mockResolvedValue(rank)
    expect(await getSubscriberRankingPosition(input)).toEqual({ position })
    expect(mocks.redis.zrevrank).toHaveBeenCalledWith('referral:ranking', 'ana-id')
  })
  it('propaga falhas do Redis', async () => {
    mocks.redis.hincrby.mockRejectedValue(new Error('redis unavailable'))
    await expect(accessInviteLink(input)).rejects.toThrow('redis unavailable')
  })
})

describe('ranking', () => {
  it('combina os três primeiros com seus nomes e ordena por pontuação', async () => {
    mocks.redis.zrevrange.mockResolvedValue(['b', '9', 'c', '5', 'a', '2'])
    mocks.where.mockResolvedValue([
      { id: 'a', name: 'Ana', email: 'ana@example.com' },
      { id: 'b', name: 'Bia', email: 'bia@example.com' },
      { id: 'c', name: 'Caio', email: 'caio@example.com' },
    ])
    expect(await getRanking()).toEqual({ rankingWithScore: [
      { id: 'b', name: 'Bia', score: 9 },
      { id: 'c', name: 'Caio', score: 5 },
      { id: 'a', name: 'Ana', score: 2 },
    ] })
    expect(mocks.redis.zrevrange).toHaveBeenCalledWith('referral:ranking', 0, 2, 'WITHSCORES')
  })
  it('retorna uma lista vazia sem indicações', async () => {
    mocks.redis.zrevrange.mockResolvedValue([])
    expect(await getRanking()).toEqual({ rankingWithScore: [] })
  })
})
