import { useState } from "react";

export function useTraceDisclosure(
  id: string,
  overrides: Map<string, boolean>,
  defaultExpanded: boolean,
) {
  const [disclosure, setDisclosure] = useState(() => ({
    overrides,
    id,
    expanded: overrides.get(id),
  }));
  let choice = disclosure.expanded;
  if (disclosure.id !== id || disclosure.overrides !== overrides) {
    choice = overrides.get(id);
    setDisclosure({ overrides, id, expanded: choice });
  }
  return {
    expanded: choice ?? defaultExpanded,
    setExpanded: (expanded: boolean) => {
      overrides.set(id, expanded);
      setDisclosure({ overrides, id, expanded });
    },
  };
}
