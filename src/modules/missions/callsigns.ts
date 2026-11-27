/**
 * Group callsigns (Alpha 1-1, Alpha 1-2 …) as Arma shows them in the lobby.
 *
 * Mission makers often override the order by putting the callsign into a unit
 * description: `Командир@Альфа 2-3` / `Squad Leader@Alpha 2-3`. The same rule is
 * used in pbo-parser (https://github.com/Arma-Serious-Platform/pbo-parser).
 * The web client has a copy of this logic for plans saved before `callsign`
 * was added to groups — keep them in sync.
 */

type CallsignUnit = { description?: string | null; isPlayable: boolean };
type CallsignGroup = { side: string; units: CallsignUnit[] };

/** `@Alpha 2-3`, `@Альфа 2-3`, `@alpha 2 - 3` (Latin or Cyrillic, any case). */
const MANUAL_CALLSIGN_REGEXP = /@\s*(?:alpha|альфа)\s*(\d+)\s*-\s*(\d+)/iu;

const SQUAD_SIZE = 6;

const formatCallsign = (squad: number, position: number) =>
  `Alpha ${squad}-${position}`;

const extractManualCallsign = (description?: string | null) => {
  if (!description) return null;

  const match = MANUAL_CALLSIGN_REGEXP.exec(description);
  if (!match) return null;

  const squad = Number.parseInt(match[1], 10);
  const position = Number.parseInt(match[2], 10);
  if (!Number.isFinite(squad) || !Number.isFinite(position)) return null;

  return formatCallsign(squad, position);
};

/** Override from the first playable unit, otherwise from any playable unit. */
const getGroupManualCallsign = (units: CallsignUnit[]) =>
  units
    .map((unit) => extractManualCallsign(unit.description))
    .find((callsign): callsign is string => Boolean(callsign)) ?? null;

/**
 * Returns the groups with `callsign` filled in, per side:
 * - groups without playable units get `null` (they are not in the lobby);
 * - a `@Alpha X-Y` override wins;
 * - the rest get the next free Alpha 1-1 … 1-6, 2-1 … in mission order,
 *   skipping callsigns already taken by overrides.
 */
const assignCallsigns = <T extends CallsignGroup>(
  groups: T[],
): (T & { callsign: string | null })[] => {
  const result = groups.map((group) => {
    const playable = group.units.filter((unit) => unit.isPlayable);

    return {
      group,
      playable: playable.length > 0,
      manual: getGroupManualCallsign(playable),
    };
  });

  const callsigns = new Map<number, string | null>();
  const sides = [...new Set(groups.map((group) => group.side))];

  sides.forEach((side) => {
    const sideItems = result
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.group.side === side && item.playable);

    const taken = new Set(sideItems.map((item) => item.manual).filter(Boolean));

    let counter = 0;
    const nextFree = () => {
      let callsign: string;

      do {
        callsign = formatCallsign(
          Math.floor(counter / SQUAD_SIZE) + 1,
          (counter % SQUAD_SIZE) + 1,
        );
        counter++;
      } while (taken.has(callsign));

      taken.add(callsign);
      return callsign;
    };

    sideItems.forEach((item) => {
      callsigns.set(item.index, item.manual ?? nextFree());
    });
  });

  return result.map(({ group }, index) => ({
    ...group,
    callsign: callsigns.get(index) ?? null,
  }));
};

export { assignCallsigns, extractManualCallsign };
