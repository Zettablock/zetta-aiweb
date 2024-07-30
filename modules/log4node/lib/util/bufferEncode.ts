import varint from 'varint'

export class BufferEncode {
  private chunks = [] as Buffer[]

  public get() {
    return Buffer.concat(this.chunks)
  }

  public append(buf: Buffer) {
    this.chunks.push(buf)
  }

  public writeVarint(value: number) {
    this.append(Buffer.from(varint.encode(value)))
  }

  public writeString(str = '') {
    const len = str.length
    if (len > 0) {
      const buf = Buffer.from(str, 'utf8')
      this.writeVarint(buf.byteLength)
      this.append(buf)
      return
    }
    this.writeVarint(0)
  }

  public writeBoolean(val: boolean) {
    const bf = Buffer.alloc(1)
    bf.writeUInt8(val ? 0xff : 0)
    this.append(bf)
  }

  public writeVersion(ver: string) {
    this.append(Buffer.from(ver, 'utf8'))
  }

  public writeId(id: string) {
    this.append(Buffer.from(id, 'utf8'))
  }

  public writeTimestamp(timestamp: number) {
    this.writeVarint(timestamp)
  }

  public writeDuration(duration: number) {
    this.writeVarint(duration)
  }
}
