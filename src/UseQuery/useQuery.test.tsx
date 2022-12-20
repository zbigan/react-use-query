import React from 'react';
import { useQuery } from "./useQuery";
import { waitFor, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const fakeResponse = "fakeResponse";
const fakeResponseAfterRefetch = "fakeResponseAfterRefetch";
const fakeRejectResponse = "rejected";

const functionReturningResolvedPromiseWithValue = (value: string | number = fakeResponse) =>
  Promise.resolve(value);
const functionReturningRejectedPromiseWithValue = (value: string = fakeRejectResponse) =>
  Promise.reject(value);
const functionReturningResolvedPromiseWithTimeout = (timeout = 1000) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(timeout), timeout);
  });

const ContainerComponent: React.FC<{
  fn: (arg: any) => Promise<any>;
  arg: string | number;
}> = ({ fn, arg }) => {
  const { refetch, isLoading, error, data, isInitialLoading } = useQuery(fn, {
    args: [arg],
  });

  return (
    <div>
      <span data-testid="data">{String(data)}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="isInitialLoading">{String(isInitialLoading)}</span>
      <span data-testid="error">{String(error)}</span>
      <button data-testid="refetch" onClick={() => refetch(fakeResponseAfterRefetch)}>
        refetch
      </button>
    </div>
  );
};

describe("testing 'useQuery' hook", () => {
  it("should render correct data", async () => {
    const { getByTestId } = render(
      <ContainerComponent fn={functionReturningResolvedPromiseWithValue} arg={fakeResponse} />
    );

    await waitFor(() => {
      expect(getByTestId("data")).toHaveTextContent(String(fakeResponse));
    });
  });

  it("should render updated data after invoking 'refetch' method", async () => {
    const user = userEvent.setup();
    expect.hasAssertions();

    const { getByTestId } = render(
      <ContainerComponent fn={functionReturningResolvedPromiseWithValue} arg={fakeResponse} />
    );

    await waitFor(() => {
      expect(getByTestId("data")).toHaveTextContent(String(fakeResponse));
    });

    await user.click(getByTestId("refetch"));

    await waitFor(() => {
      expect(getByTestId("data")).toHaveTextContent(String(fakeResponseAfterRefetch));
    });
  });

  it("should render 'isInitialLoading' of value 'true' before first time hook is called and 'false' once it returned resolved promise", async () => {
    const timeout = 1000;
    expect.hasAssertions();

    const { getByTestId } = render(
      <ContainerComponent fn={functionReturningResolvedPromiseWithTimeout} arg={timeout} />
    );

    await waitFor(() => {
      expect(getByTestId("isInitialLoading")).toHaveTextContent(String(true));
    });

    await waitFor(
      () => {
        expect(getByTestId("isInitialLoading")).toHaveTextContent(String(false));
      },
      { timeout: timeout + 500 }
    );
  });

  it("should render 'isLoading' value of 'true' while resolving promise", async () => {
    const user = userEvent.setup();
    expect.hasAssertions();
    const timeout = 1000;

    const { getByTestId } = render(
      <ContainerComponent fn={functionReturningResolvedPromiseWithTimeout} arg={timeout} />
    );

    await waitFor(() => {
      expect(getByTestId("isLoading")).toHaveTextContent(String(true));
    });

    await waitFor(
      () => {
        expect(getByTestId("isLoading")).toHaveTextContent(String(false));
      },
      { timeout: timeout + 200 }
    );

    await user.click(getByTestId("refetch"));

    await waitFor(() => {
      expect(getByTestId("isLoading")).toHaveTextContent(String(true));
    });

    await waitFor(
      () => {
        expect(getByTestId("isLoading")).toHaveTextContent(String(false));
      },
      { timeout: timeout + 200 }
    );
  });

  it("should render 'error' value of '!undefined' after rejecting promise and 'data' should be of value 'null'", async () => {
    const { getByTestId } = render(
      <ContainerComponent fn={functionReturningRejectedPromiseWithValue} arg={fakeRejectResponse} />
    );

    await waitFor(() => {
      expect(getByTestId("error")).not.toHaveTextContent(String(undefined));
    });

    await waitFor(() => {
      expect(getByTestId("data")).toHaveTextContent(String(null));
    });
  });
});
