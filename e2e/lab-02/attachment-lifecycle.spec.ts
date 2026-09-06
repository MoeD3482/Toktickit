import {
  expect,
  test,
  type Page,
} from "@playwright/test";

async function selectRequester(
  page: Page
): Promise<string> {
  await page.goto("/");

  const requesterSelect =
    page.locator(
      "#developmentRequester"
    );

  await expect(
    requesterSelect
  ).toBeVisible();

  await requesterSelect.selectOption({
    index: 1,
  });

  const requesterId =
    await requesterSelect.inputValue();

  await page
    .getByRole("button", {
      name: "Continue",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Create Ticket",
    })
  ).toBeVisible();

  return requesterId;
}

async function createTicketAndOpenDetail(
  page: Page
) {
  const uniqueValue =
    Date.now();

  const summary =
    `E2E Attachment ${uniqueValue}`;

  await page
    .locator("#category")
    .selectOption({
      index: 1,
    });

  await page
    .locator("#relatedSystem")
    .selectOption({
      index: 1,
    });

  await page
    .locator(
      "#requestedPriority"
    )
    .selectOption("Medium");

  await page
    .locator("#summary")
    .fill(summary);

  await page
    .locator("#description")
    .fill(
      `Attachment lifecycle verification Ticket ${uniqueValue}.`
    );

  await page
    .getByRole("button", {
      name: "Submit Ticket",
    })
    .click();

  await expect(
    page.getByText(
      "Ticket created successfully."
    )
  ).toBeVisible();

  const ticketNo =
    await page
      .locator("#ticketNumber")
      .inputValue();

  await page
    .getByRole("button", {
      name: "My Tickets",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "My Tickets",
    })
  ).toBeVisible();

  await page
    .locator("#ticketSearch")
    .fill(summary);

  await page
    .getByRole("button", {
      name: "Apply",
    })
    .click();

  await expect(
    page.getByText(summary, {
      exact: true,
    })
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: ticketNo,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Ticket Detail",
    })
  ).toBeVisible();

  await expect(
    page.getByLabel(
      /choose attachment/i
    )
  ).toBeVisible();
}

test(
  "E2E-03 uploads, downloads, soft-removes, and blocks removed Attachment download",
  async ({
    page,
    request,
  }) => {
    const requesterId =
      await selectRequester(page);

    await createTicketAndOpenDetail(
      page
    );

    const filename =
      "e2e-proof.pdf";

    const fileInput =
      page.getByLabel(
        /choose attachment/i
      );

    await fileInput.setInputFiles({
      name: filename,

      mimeType:
        "application/pdf",

      buffer: Buffer.from(
        "%PDF-1.4\nTokTickIT E2E Attachment"
      ),
    });

    /*
     * Confirm that the browser file
     * input received the selected file.
     */
    await expect(
      fileInput
    ).toHaveValue(
      /e2e-proof\.pdf/
    );

    const uploadButton =
      page.getByRole("button", {
        name:
          "Upload Attachment",
      });

    await expect(
      uploadButton
    ).toBeVisible();

    await expect(
      uploadButton
    ).toBeEnabled();

    const uploadResponsePromise =
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              "/attachments"
            ) &&
          response
            .request()
            .method() ===
            "POST"
      );

    await uploadButton.click();

    const uploadResponse =
      await uploadResponsePromise;

    expect(
      uploadResponse.status()
    ).toBe(201);

    const uploadBody =
      await uploadResponse.json();

    const attachmentId =
      uploadBody.id ??
      uploadBody.data?.id;

    expect(
      attachmentId
    ).toBeTruthy();

    const ticketMatch =
      uploadResponse
        .url()
        .match(
          /\/tickets\/([^/]+)\/attachments/
        );

    expect(
      ticketMatch
    ).not.toBeNull();

    const ticketId =
      decodeURIComponent(
        ticketMatch![1]
      );

    /*
     * After upload succeeds,
     * Attachment metadata must appear.
     */
    await expect(
      page.getByText(
        filename,
        {
          exact: true,
        }
      )
    ).toBeVisible();

    const downloadButton =
      page.getByRole("button", {
        name:
          `Download ${filename}`,
      });

    await expect(
      downloadButton
    ).toBeVisible();

    const downloadPromise =
      page.waitForEvent(
        "download"
      );

    await downloadButton.click();

    const download =
      await downloadPromise;

    expect(
      download.suggestedFilename()
    ).toBe(filename);

    await page
      .getByRole("button", {
        name:
          `Remove ${filename}`,
      })
      .click();

    const reasonInput =
      page.getByLabel(
        /removal reason/i
      );

    await reasonInput.fill(
      "E2E soft removal verification."
    );

    const confirmButton =
      page.getByRole("button", {
        name:
          /confirm removal/i,
      });

    await expect(
      confirmButton
    ).toBeEnabled();

    await confirmButton.click();

    await expect(
      page.getByText(
        /^Removed$/i
      )
    ).toBeVisible();

    /*
     * Removed Attachment must no longer
     * have a browser download action.
     */
    await expect(
      page.getByRole("button", {
        name:
          `Download ${filename}`,
      })
    ).toHaveCount(0);

    /*
     * The API must also prevent direct
     * binary download after soft removal.
     */
    const blockedResponse =
      await request.get(
        `http://127.0.0.1:3000/api/v1/tickets/${ticketId}/attachments/${attachmentId}/download`,
        {
          headers: {
            "X-Development-Requester-Id":
              requesterId,
          },
        }
      );

    expect(
      blockedResponse.status()
    ).not.toBe(200);
  }
);