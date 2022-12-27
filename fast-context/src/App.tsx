import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useSyncExternalStore,
  useRef,
} from "react";

type Store = { first: string; last: string };
type Listener = () => void;

function useStoreData(): {
  get: () => Store;
  set: (newStore: Partial<Store>) => void;
  subscribe: (listener: Listener) => () => void;
} {
  const listeners = useRef(new Set<Listener>());
  const store = useRef({
    first: "",
    last: "",
  });

  const get = useCallback(() => store.current, []);

  const set = useCallback((value: Partial<Store>) => {
    store.current = { ...store.current, ...value };

    listeners.current.forEach((listener) => listener());
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);

    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  return {
    get,
    set,
    subscribe,
  };
}

type UseStoreData = ReturnType<typeof useStoreData>;

const StoreContext = createContext<UseStoreData | null>(null);

function StoreProvider({ children }: PropsWithChildren) {
  const store = useStoreData();

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

function useStore<SelectorOutput>(
  selector: (store: Store) => SelectorOutput
): [SelectorOutput, (store: Partial<Store>) => void] {
  const context = useContext(StoreContext);

  if (!context)
    throw new Error("useStore must be used within a StoreProvider.");

  const store = useSyncExternalStore(context.subscribe, () =>
    selector(context.get())
  );

  return [store, context.set];
}

const TextInput = ({ value }: { value: "first" | "last" }) => {
  const [fieldValue, setStore] = useStore((store) => store[value]);

  return (
    <div className="field">
      {value}:{" "}
      <input
        value={fieldValue}
        onChange={(e) => setStore({ [value]: e.target.value })}
      />
    </div>
  );
};

const Display = ({ value }: { value: "first" | "last" }) => {
  const [fieldValue] = useStore((store) => store[value]);

  return (
    <div className="value">
      {value}: {fieldValue}
    </div>
  );
};

const FormContainer = () => {
  return (
    <div className="container">
      <h5>FormContainer</h5>
      <TextInput value="first" />
      <TextInput value="last" />
    </div>
  );
};

const DisplayContainer = () => {
  return (
    <div className="container">
      <h5>DisplayContainer</h5>
      <Display value="first" />
      <Display value="last" />
    </div>
  );
};

const ContentContainer = () => {
  return (
    <div className="container">
      <h5>ContentContainer</h5>
      <FormContainer />
      <DisplayContainer />
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <div className="container">
        <h5>App</h5>
        <ContentContainer />
      </div>
    </StoreProvider>
  );
}

export default App;
