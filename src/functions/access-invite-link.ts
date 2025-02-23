import { db } from '../drizzle/client'
import { subscriptions } from '../drizzle/schema/subscriptions'
import { redis } from '../redis/client' // minha função de conexão com o radis

interface accessInviteLink {
  subscriberId: string
}

export async function accessInviteLink({ subscriberId }: accessInviteLink) {
  await redis.hincrby('referral:access-count', subscriberId, 1)
}
