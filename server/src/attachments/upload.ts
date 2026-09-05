import multer from "multer";
import path from "node:path";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
]);

type DetectedAttachmentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf"
  | null;

export const attachmentUpload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        MAX_FILE_SIZE,
      files: 1,
    },

    fileFilter: (
      _req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const validMimeType =
        ALLOWED_MIME_TYPES.has(
          file.mimetype
        );

      const validExtension =
        ALLOWED_EXTENSIONS.has(
          extension
        );

      if (
        !validMimeType ||
        !validExtension
      ) {
        callback(
          new Error(
            "ATTACHMENT_TYPE_INVALID"
          )
        );

        return;
      }

      callback(null, true);
    },
  });

function detectAttachmentType(
  buffer: Buffer
): DetectedAttachmentType {
  /*
   * PDF
   * %PDF-
   */
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return "application/pdf";
  }

  /*
   * PNG
   * 89 50 4E 47 0D 0A 1A 0A
   */
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  /*
   * JPEG
   * FF D8 FF
   */
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  /*
   * WEBP
   * RIFF....WEBP
   */
  if (
    buffer.length >= 12 &&
    buffer.toString(
      "ascii",
      0,
      4
    ) === "RIFF" &&
    buffer.toString(
      "ascii",
      8,
      12
    ) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function attachmentTypeMatchesExtension(
  detectedType: Exclude<
    DetectedAttachmentType,
    null
  >,
  extension: string
): boolean {
  if (
    detectedType ===
    "application/pdf"
  ) {
    return extension === ".pdf";
  }

  if (
    detectedType ===
    "image/png"
  ) {
    return extension === ".png";
  }

  if (
    detectedType ===
    "image/webp"
  ) {
    return extension === ".webp";
  }

  if (
    detectedType ===
    "image/jpeg"
  ) {
    return (
      extension === ".jpg" ||
      extension === ".jpeg"
    );
  }

  return false;
}

function hasValidDetectedContent(
  file: Express.Multer.File
): boolean {
  const detectedType =
    detectAttachmentType(
      file.buffer
    );

  if (!detectedType) {
    return false;
  }

  if (
    detectedType !==
    file.mimetype
  ) {
    return false;
  }

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();

  return attachmentTypeMatchesExtension(
    detectedType,
    extension
  );
}

export function attachmentUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  attachmentUpload.single(
    "file"
  )(
    req,
    res,
    (error: unknown) => {
      if (error) {
        if (
          error instanceof
            multer.MulterError &&
          error.code ===
            "LIMIT_FILE_SIZE"
        ) {
          res
            .status(422)
            .json({
              error: {
                code: "ATTACHMENT_TOO_LARGE",
                message:
                  "Attachment must not exceed 5 MB.",
                fieldErrors: [],
              },
            });

          return;
        }

        if (
          error instanceof
            Error &&
          error.message ===
            "ATTACHMENT_TYPE_INVALID"
        ) {
          res
            .status(422)
            .json({
              error: {
                code: "ATTACHMENT_TYPE_INVALID",
                message:
                  "Only JPG, JPEG, PNG, WEBP, and PDF Attachments are allowed.",
                fieldErrors: [],
              },
            });

          return;
        }

        res
          .status(422)
          .json({
            error: {
              code: "ATTACHMENT_UPLOAD_INVALID",
              message:
                "The Attachment could not be processed.",
              fieldErrors: [],
            },
          });

        return;
      }

      if (!req.file) {
        res
          .status(422)
          .json({
            error: {
              code: "ATTACHMENT_FILE_REQUIRED",
              message:
                "An Attachment file is required.",
              fieldErrors: [],
            },
          });

        return;
      }

      /*
       * Do not trust only the filename
       * extension or browser-declared MIME.
       * Inspect the actual uploaded bytes.
       */
      if (
        !hasValidDetectedContent(
          req.file
        )
      ) {
        res
          .status(422)
          .json({
            error: {
              code: "ATTACHMENT_CONTENT_INVALID",
              message:
                "Attachment content does not match its declared file type.",
              fieldErrors: [],
            },
          });

        return;
      }

      next();
    }
  );
}

export const ATTACHMENT_MAX_FILE_SIZE =
  MAX_FILE_SIZE;