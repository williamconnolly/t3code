import { expect, it } from "vite-plus/test";
import { render } from "../../../test/render";
import { useTraceDisclosure } from "./useTraceDisclosure";

function Disclosure(props: {
  id: string;
  overrides: Map<string, boolean>;
  defaultExpanded: boolean;
}) {
  const { expanded, setExpanded } = useTraceDisclosure(
    props.id,
    props.overrides,
    props.defaultExpanded,
  );
  return (
    <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      Details
    </button>
  );
}

it("applies changed defaults immediately and keeps manual choices through later setting changes", async () => {
  const overrides = new Map<string, boolean>();
  await using screen = await render(
    <Disclosure id="a" overrides={overrides} defaultExpanded={false} />,
  );
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  await screen.rerender(<Disclosure id="a" overrides={overrides} defaultExpanded />);
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  await screen.getByRole("button").click();
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  await screen.rerender(<Disclosure id="a" overrides={overrides} defaultExpanded={false} />);
  await screen.rerender(<Disclosure id="a" overrides={overrides} defaultExpanded />);
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  await screen.getByRole("button").click();
  await screen.rerender(<Disclosure id="a" overrides={overrides} defaultExpanded={false} />);
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
});

it("restores an entry's choice after recycling and remounting without leaking it to another thread", async () => {
  const overrides = new Map<string, boolean>();
  await using screen = await render(<Disclosure id="a" overrides={overrides} defaultExpanded />);
  await screen.getByRole("button").click();
  await screen.rerender(<Disclosure id="b" overrides={overrides} defaultExpanded />);
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  await screen.rerender(<Disclosure id="a" overrides={overrides} defaultExpanded />);
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  await screen.rerender(
    <Disclosure key="remounted" id="a" overrides={overrides} defaultExpanded />,
  );
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  await screen.rerender(
    <Disclosure key="remounted" id="a" overrides={new Map()} defaultExpanded />,
  );
  await expect.element(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
});
