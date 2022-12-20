import { useAction } from "./useAction";
import { renderHook, waitFor, act } from "@testing-library/react";

describe("testing 'useAction' hook", () => {
  const expectedResultKeys: Array<keyof ReturnType<typeof useAction>> = [
    "action",
    "error",
    "isLoading",
    "isInitialLoading",
  ];
  const fakeResponse = "fakeResponse";
  const fakeRejectResponse = "rejected";

  const functionReturningResolvedPromiseWithValue = (value: string | number = fakeResponse) =>
    Promise.resolve(value);
  const functionReturningRejectedPromise = (value: string = fakeRejectResponse) =>
    Promise.reject(value);
  const functionReturningResolvedPromiseWithTimeout = (timeout = 1000) =>
    new Promise((resolve) => {
      setTimeout(() => resolve("resolved"), timeout);
    });

  it("should return correct values", () => {
    const { result } = renderHook(() => useAction(functionReturningResolvedPromiseWithValue));
    const resultObjectKeys = Object.keys(result.current);

    expectedResultKeys.forEach((expectedKey) => {
      expect(resultObjectKeys).toContain(expectedKey);
    });
  });

  it("should match correct types of retured values", () => {
    const { result } = renderHook(() => useAction(functionReturningResolvedPromiseWithValue));

    expect(typeof result.current["action"]).toEqual("function");
    expect(typeof result.current["error"]).toEqual("undefined");
    expect(typeof result.current["isLoading"]).toEqual("boolean");
    expect(typeof result.current["isInitialLoading"]).toEqual("boolean");
  });

  it("should be able to call returned 'action' method successfully", async () => {
    const { result } = renderHook(() => useAction(functionReturningResolvedPromiseWithValue));

    await act(async () => {
      const actionResult = await result.current.action(fakeResponse);
      expect(actionResult).toEqual(fakeResponse);
    });
  });

  it("should be able to call returned 'action' method unsuccessfully", async () => {
    const { result } = renderHook(() => useAction(functionReturningRejectedPromise));

    await act(async () => {
      const actionResult = await result.current.action(fakeRejectResponse);
      expect(actionResult).toEqual(null);
    });
  });

  it("should return 'isInitialLoading' of value 'true' before first time 'action' is called and 'false' if it is after first time", async () => {
    const { result } = renderHook(() => useAction(functionReturningResolvedPromiseWithValue));

    expect(result.current.isInitialLoading).toBe(true);

    await act(async () => {
      await result.current.action(fakeResponse);
    });

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
  });

  it("should return 'isLoading' of value 'false' if action is not called yet, 'true' if promise is in 'pending' state and 'false' if promise is resolved", async () => {
    const timeout = 1000;
    const { result } = renderHook(() => useAction(functionReturningResolvedPromiseWithTimeout));

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.action(timeout);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: timeout + 500,
    });
  });

  it("should call 'onError' callback if provided", async () => {
    const onErrorFake = jest.fn((e: unknown) => `This is error: ${e}`);

    const { result } = renderHook(() =>
      useAction(functionReturningRejectedPromise, {
        onError: onErrorFake,
      })
    );

    await act(async () => {
      await result.current.action();
    });

    expect(onErrorFake).toHaveBeenCalled();
  });

  it("should call 'onSuccess' callback if provided", async () => {
    const onSuccessFake = jest.fn(
      () => {}
    );

    const { result } = renderHook(() =>
      useAction(functionReturningResolvedPromiseWithValue, {
        onSuccess: onSuccessFake,
      })
    );

    await act(async () => {
      await result.current.action();
    });

    expect(onSuccessFake).toHaveBeenCalled();
  });
});
