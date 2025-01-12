import { NextResponse } from 'next/server'
import crypto from 'crypto'

// This is the hash of the password using SHA-256
const VALID_PASSWORD_HASH = 'b501859648c0b20e3a300961da1eb8254e9649b58f7813120d681c99d88f8a98'

function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const hashedPassword = hashPassword(password)
    
    const isValid = hashedPassword === VALID_PASSWORD_HASH
    
    return NextResponse.json({ isValid })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
