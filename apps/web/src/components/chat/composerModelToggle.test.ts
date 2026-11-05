import { ProviderDriverKind, ProviderInstanceId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";
import { deriveProviderInstanceEntries } from "../../providerInstances";
import { resolveComposerModelToggle } from "./composerModelToggle";

function entry(driver: string, model: string, instanceId = driver) {
  return deriveProviderInstanceEntries([
    {
      driver: ProviderDriverKind.make(driver),
      instanceId: ProviderInstanceId.make(instanceId),
      enabled: true,
      installed: true,
      version: null,
      status: "ready",
      auth: { status: "authenticated" },
      checkedAt: "2026-01-01T00:00:00.000Z",
      models: [{ slug: model, name: model, isCustom: false, capabilities: {} }],
      slashCommands: [],
      skills: [],
    },
  ])[0]!;
}

describe("resolveComposerModelToggle", () => {
  it.each([
    ["codex", "gpt-6.1-sol", "claudeAgent", "claude-opus-5-5"],
    ["claudeAgent", "claude-opus-5-5", "codex", "gpt-6.1-sol"],
    ["claudeAgent", "claude-haiku-5-5", "codex", "gpt-6.1-sol"],
    ["codex", "another-model", "codex", "gpt-6.1-sol"],
  ])("switches %s %s to %s %s", (driver, model, target, targetModel) => {
    expect(
      resolveComposerModelToggle({
        provider: ProviderDriverKind.make(driver),
        instanceId: ProviderInstanceId.make(driver),
        model,
        entries: [entry("codex", "gpt-6.1-sol"), entry("claudeAgent", "claude-opus-5-5")],
        getModelDisabledReason: () => null,
      }),
    ).toEqual({ instanceId: target, model: targetModel });
  });

  it("keeps the active provider instance and otherwise prefers the default", () => {
    const custom = entry("codex", "gpt-6.1-sol", "custom-codex");
    const defaultEntry = entry("codex", "gpt-6.1-sol");
    const input = {
      provider: ProviderDriverKind.make("codex"),
      instanceId: custom.instanceId,
      model: "other-model",
      entries: [custom, defaultEntry],
      getModelDisabledReason: () => null,
    };
    expect(resolveComposerModelToggle(input)?.instanceId).toBe(custom.instanceId);
    expect(
      resolveComposerModelToggle({ ...input, instanceId: ProviderInstanceId.make("claudeAgent") })
        ?.instanceId,
    ).toBe(defaultEntry.instanceId);
  });

  it("rejects unavailable, disabled, unready, missing, and blocked targets", () => {
    const target = entry("claudeAgent", "claude-opus-5-5");
    for (const candidate of [
      { ...target, isAvailable: false },
      { ...target, enabled: false },
      { ...target, status: "error" as const },
      { ...target, models: [] },
    ]) {
      expect(
        resolveComposerModelToggle({
          provider: ProviderDriverKind.make("codex"),
          instanceId: ProviderInstanceId.make("codex"),
          model: "gpt-6.1-sol",
          entries: [candidate],
          getModelDisabledReason: () => null,
        }),
      ).toBeNull();
    }
    expect(
      resolveComposerModelToggle({
        provider: ProviderDriverKind.make("codex"),
        instanceId: ProviderInstanceId.make("codex"),
        model: "gpt-6.1-sol",
        entries: [target],
        getModelDisabledReason: () => "Provider switching is unavailable",
      }),
    ).toBeNull();
  });
});
