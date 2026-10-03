import { render, screen } from "@testing-library/react";
import { UpdatedNote } from "./UpdatedNote";

const at = new Date(2026, 9, 4, 13, 5);

describe("UpdatedNote", () => {
  it("shows nothing on a quiet day", () => {
    const { container } = render(
      <UpdatedNote updatedAt={at} refreshFailed={false} live={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows when scores were fetched while a game is live", () => {
    render(<UpdatedNote updatedAt={at} refreshFailed={false} live />);
    expect(screen.getByRole("status")).toHaveTextContent(/^Updated /);
  });

  it("says a failed refresh is showing older scores, live or not", () => {
    render(<UpdatedNote updatedAt={at} refreshFailed live={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /Couldn't refresh\. Showing .+, trying again every minute\./
    );
  });
});
