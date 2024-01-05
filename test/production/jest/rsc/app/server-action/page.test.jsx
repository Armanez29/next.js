/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Page from "./page";

it("works with client-only code", () => {
  render(<Page />);
  expect(screen.getByTestId("log")).toHaveTextContent("log");
});
