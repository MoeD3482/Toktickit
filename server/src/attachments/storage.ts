interface StoredFile {
  buffer: Buffer;
  mimeType: string;
}

export interface AttachmentStorage {
  save(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void>;

  get(storageKey: string): Promise<StoredFile | null>;

  remove(storageKey: string): Promise<void>;
}

class MemoryAttachmentStorage implements AttachmentStorage {
  private files = new Map<string, StoredFile>();

  async save(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    this.files.set(storageKey, {
      buffer,
      mimeType,
    });
  }

  async get(storageKey: string): Promise<StoredFile | null> {
    return this.files.get(storageKey) ?? null;
  }

  async remove(storageKey: string): Promise<void> {
    this.files.delete(storageKey);
  }
}

class SeaweedAttachmentStorage implements AttachmentStorage {
  private readonly baseUrl =
    process.env.SEAWEEDFS_FILER_URL ?? "http://localhost:8888";

  async save(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/toktickit-attachments/${storageKey}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
    body: new Blob([Uint8Array.from(buffer)], {
     type: mimeType,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Attachment storage upload failed.");
    }
  }

  async get(storageKey: string): Promise<StoredFile | null> {
    const response = await fetch(
      `${this.baseUrl}/toktickit-attachments/${storageKey}`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Attachment storage download failed.");
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType:
        response.headers.get("content-type") ??
        "application/octet-stream",
    };
  }

  async remove(storageKey: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/toktickit-attachments/${storageKey}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error("Attachment storage removal failed.");
    }
  }
}

export const attachmentStorage: AttachmentStorage =
  process.env.NODE_ENV === "test"
    ? new MemoryAttachmentStorage()
    : new SeaweedAttachmentStorage();