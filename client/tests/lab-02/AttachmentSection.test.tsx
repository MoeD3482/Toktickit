import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import AttachmentSection from "../../src/components/AttachmentSection";

describe("AttachmentSection", () => {
  it("shows a permitted Attachment after the user selects it", () => {
    render(
      <AttachmentSection
        requesterId="requester-1"
        ticketId="ticket-1"
      />
    );

    const fileInput = screen.getByLabelText(
      /choose attachment/i
    );

    const file = new File(
      ["%PDF-1.4 test"],
      "evidence.pdf",
      {
        type: "application/pdf",
      }
    );

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("evidence.pdf")
    ).toBeInTheDocument();
  });

  it("shows an error for an unsupported Attachment type", () => {
    render(
      <AttachmentSection
        requesterId="requester-1"
        ticketId="ticket-1"
      />
    );

    const fileInput = screen.getByLabelText(
      /choose attachment/i
    );

    const file = new File(
      ["not allowed"],
      "malware.txt",
      {
        type: "text/plain",
      }
    );

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText(
        /only jpg, jpeg, png, webp, and pdf attachments are allowed/i
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("malware.txt")
    ).not.toBeInTheDocument();
  });

  it("requires confirmation and a reason before removing an Attachment", async () => {
    const onRemove = vi.fn();

    render(
      <AttachmentSection
        requesterId="requester-1"
        ticketId="ticket-1"
        attachments={[
          {
            id: "attachment-1",
            originalFilename: "old-evidence.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1200,
            isRemoved: false,
          },
        ]}
        onRemove={onRemove}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove old-evidence.pdf/i,
      })
    );

    const confirmButton = screen.getByRole(
      "button",
      {
        name: /confirm removal/i,
      }
    );

    expect(confirmButton).toBeDisabled();

    fireEvent.change(
      screen.getByLabelText(/removal reason/i),
      {
        target: {
          value: "Uploaded the wrong file.",
        },
      }
    );

    expect(confirmButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(onRemove).toHaveBeenCalledWith(
      "attachment-1",
      "Uploaded the wrong file."
    );
  });

  it("shows removed Attachment metadata without a download action", () => {
    render(
      <AttachmentSection
        requesterId="requester-1"
        ticketId="ticket-1"
        attachments={[
          {
            id: "attachment-removed",
            originalFilename: "removed-proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 2048,
            isRemoved: true,
          },
        ]}
      />
    );

    expect(
      screen.getByText("removed-proof.pdf")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/^removed$/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /remove removed-proof.pdf/i,
      })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: /download removed-proof.pdf/i,
      })
    ).not.toBeInTheDocument();
  });

  it("shows a failed upload and allows the Attachment to be retried", () => {
    const onRetryUpload = vi.fn();

    render(
      <AttachmentSection
        requesterId="requester-1"
        ticketId="ticket-1"
        failedAttachment={{
          filename: "failed-proof.pdf",
          message: "Attachment upload failed.",
        }}
        onRetryUpload={onRetryUpload}
      />
    );

    expect(
      screen.getByText("failed-proof.pdf")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/attachment upload failed/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /retry failed-proof.pdf/i,
      })
    );

    expect(
      onRetryUpload
    ).toHaveBeenCalledTimes(1);
  });
});