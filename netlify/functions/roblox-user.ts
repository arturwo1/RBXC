interface NetlifyEvent {
  queryStringParameters?: Record<string, string | undefined>;
}

export type ClassicBadgeKey = 'hellfire' | 'soulReap' | 'allSath';

export interface ClassicBadgeCheck {
  badgeId: number;
  key: ClassicBadgeKey;
  awardedDate: string | null;
}

interface RobloxLookupResult {
  userId: number;
  username: string;
  displayName: string;
  createdAt: string | null;
  avatarUrl: string | null;
  gamepasses: {
    halfCooldown: boolean;
  };
  vipTrackable: false;
  badgesCount: number;
  classicBadges: ClassicBadgeCheck[];
  earliestClassicBadgeDate: string | null;
  source: 'roblox-api';
}

// SPTS Classic Half Skill Cooldown Gamepass ID (VIP is a consumable Dev Product, not inventory-trackable)
const SPTS_HALF_COOLDOWN_GAMEPASS_ID = 5145588;

// Classic SPTS milestone badges used to verify pre-launch OG play & earliest start date
const SPTS_CLASSIC_OG_BADGES: ReadonlyArray<{ badgeId: number; key: ClassicBadgeKey }> = [
  { badgeId: 2124441182, key: 'hellfire' },
  { badgeId: 2124441172, key: 'soulReap' },
  { badgeId: 2124441169, key: 'allSath' }
];

const ROBLOX_FETCH_TIMEOUT_MS = 8000;

export async function handler(event: NetlifyEvent) {
  const rawQuery = (
    event.queryStringParameters?.query ||
    event.queryStringParameters?.username ||
    ''
  ).trim();

  const isNumericId = /^\d{1,15}$/.test(rawQuery);
  const isUsername = /^[A-Za-z0-9_]{3,20}$/.test(rawQuery);

  if (!rawQuery || (!isNumericId && !isUsername)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid Roblox username or User ID format.' })
    };
  }

  try {
    let found: { id: number; name: string; displayName: string; created?: string } | undefined;

    if (isNumericId) {
      const idRes = await fetch(`https://users.roblox.com/v1/users/${rawQuery}`, {
        signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS)
      });
      if (idRes.status === 404) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Roblox User ID "${rawQuery}" not found.` })
        };
      }
      if (!idRes.ok) {
        throw new Error(`Roblox users API returned ${idRes.status}`);
      }
      const userObj = (await idRes.json()) as {
        id?: number;
        name?: string;
        displayName?: string;
        created?: string;
      };
      if (userObj && userObj.id && userObj.name) {
        found = {
          id: userObj.id,
          name: userObj.name,
          displayName: userObj.displayName || userObj.name,
          created: typeof userObj.created === 'string' ? userObj.created : undefined
        };
      }
    } else {
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [rawQuery], excludeBannedUsers: false }),
        signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS)
      });

      if (!userRes.ok) {
        throw new Error(`Roblox users API returned ${userRes.status}`);
      }

      const userJson = (await userRes.json()) as {
        data?: Array<{ id: number; name: string; displayName: string }>;
      };
      found = userJson.data?.[0];
    }

    if (!found || !Number.isSafeInteger(found.id) || found.id <= 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Roblox user "${rawQuery}" not found.` })
      };
    }

    const userId = found.id;
    const badgeIdsParam = SPTS_CLASSIC_OG_BADGES.map((b) => b.badgeId).join(',');

    const [thumbRes, cooldownRes, badgesRes, userDetailRes, awardedDatesRes] =
      await Promise.allSettled([
        fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
          { signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS) }
        ),
        fetch(
          `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${SPTS_HALF_COOLDOWN_GAMEPASS_ID}/is-owned`,
          { signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS) }
        ),
        fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10`, {
          signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS)
        }),
        found.created
          ? Promise.resolve(null)
          : fetch(`https://users.roblox.com/v1/users/${userId}`, {
              signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS)
            }),
        fetch(
          `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeIdsParam}`,
          { signal: AbortSignal.timeout(ROBLOX_FETCH_TIMEOUT_MS) }
        )
      ]);

    let createdAt: string | null = found.created ?? null;
    if (!createdAt && userDetailRes.status === 'fulfilled' && userDetailRes.value && userDetailRes.value.ok) {
      const detailJson = (await userDetailRes.value.json()) as { created?: string };
      if (typeof detailJson.created === 'string' && !Number.isNaN(Date.parse(detailJson.created))) {
        createdAt = detailJson.created;
      }
    }

    let avatarUrl: string | null = null;
    if (thumbRes.status === 'fulfilled' && thumbRes.value.ok) {
      const thumbJson = (await thumbRes.value.json()) as { data?: Array<{ imageUrl?: string }> };
      avatarUrl = thumbJson.data?.[0]?.imageUrl ?? null;
    }

    let halfCooldown = false;
    if (cooldownRes.status === 'fulfilled' && cooldownRes.value.ok) {
      halfCooldown = (await cooldownRes.value.text()).trim() === 'true';
    }

    let badgesCount = 0;
    if (badgesRes.status === 'fulfilled' && badgesRes.value.ok) {
      const badgesJson = (await badgesRes.value.json()) as { data?: unknown[] };
      badgesCount = Array.isArray(badgesJson.data) ? badgesJson.data.length : 0;
    }

    const awardedMap = new Map<number, string>();
    if (awardedDatesRes.status === 'fulfilled' && awardedDatesRes.value.ok) {
      const awardedJson = (await awardedDatesRes.value.json()) as {
        data?: Array<{ badgeId?: number; awardedDate?: string }>;
      };
      if (Array.isArray(awardedJson.data)) {
        for (const item of awardedJson.data) {
          if (
            typeof item.badgeId === 'number' &&
            typeof item.awardedDate === 'string' &&
            !Number.isNaN(Date.parse(item.awardedDate))
          ) {
            awardedMap.set(item.badgeId, item.awardedDate);
          }
        }
      }
    }

    const classicBadges: ClassicBadgeCheck[] = SPTS_CLASSIC_OG_BADGES.map((b) => ({
      badgeId: b.badgeId,
      key: b.key,
      awardedDate: awardedMap.get(b.badgeId) ?? null
    }));

    let earliestClassicBadgeDate: string | null = null;
    let earliestMs = Infinity;
    for (const badge of classicBadges) {
      if (!badge.awardedDate) continue;
      const ms = Date.parse(badge.awardedDate);
      if (Number.isFinite(ms) && ms < earliestMs) {
        earliestMs = ms;
        earliestClassicBadgeDate = badge.awardedDate;
      }
    }

    const payload: RobloxLookupResult = {
      userId,
      username: found.name,
      displayName: found.displayName,
      createdAt,
      avatarUrl,
      gamepasses: { halfCooldown },
      vipTrackable: false,
      badgesCount,
      classicBadges,
      earliestClassicBadgeDate,
      source: 'roblox-api'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Roblox API lookup failed';
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message, fallbackToManual: true })
    };
  }
}
