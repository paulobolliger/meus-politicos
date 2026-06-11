import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const bucket = process.env.R2_BUCKET
const publicUrl = process.env.R2_PUBLIC_URL

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`)
  }

  return value
}

function createClient() {
  return new S3Client({
    region: 'auto',
    endpoint: required('R2_ENDPOINT', process.env.R2_ENDPOINT),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID),
      secretAccessKey: required(
        'R2_SECRET_ACCESS_KEY',
        process.env.R2_SECRET_ACCESS_KEY
      ),
    },
  })
}

export async function uploadMedia(input: {
  body: Uint8Array
  contentType: string
  key: string
}) {
  await createClient().send(
    new PutObjectCommand({
      Bucket: required('R2_BUCKET', bucket),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  return `${required('R2_PUBLIC_URL', publicUrl).replace(/\/$/, '')}/${input.key}`
}
