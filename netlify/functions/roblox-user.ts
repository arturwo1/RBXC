interface NetlifyEvent {
  queryStringParameters?: Record<string, string | undefined>;
}

interface RobloxLookupResult {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gamepasses: {
    halfCooldown: boolean;
  };
  vipTrackable: false;
  badgesCount: number;
  source: 'roblox-api';
}

// SPTS Classic Half Skill Cooldown Gamepass ID (VIP is a consumable Dev Product, not inventory-trackable)
const SPTS_HALF_COOLDOWN_GAMEPASS_ID = 5145588;

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
    let found: { id: number; name: string; displayName: string } | undefined;

    if (isNumericId) {
      const idRes = await fetch(`https://users.roblox.com/v1/users/${rawQuery}`);
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
      };
      if (userObj && userObj.id && userObj.name) {
        found = {
          id: userObj.id,
          name: userObj.name,
          displayName: userObj.displayName || userObj.name
        };
      }
    } else {
      const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [rawQuery], excludeBannedUsers: false })
      });

      if (!userRes.ok) {
        throw new Error(`Roblox users API returned ${userRes.status}`);
      }

      const userJson = (await userRes.json()) as {
        data?: Array<{ id: number; name: string; displayName: string }>;
      };
      found = userJson.data?.[0];
    }

    if (!found) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Roblox user "${rawQuery}" not found.` })
      };
    }

    const userId = found.id;
    const [thumbRes, cooldownRes, badgesRes] = await Promise.allSettled([
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`),
      fetch(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${SPTS_HALF_COOLDOWN_GAMEPASS_ID}/is-owned`),
      fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10`)
    ]);

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

    const payload: RobloxLookupResult = {
      userId,
      username: found.name,
      displayName: found.displayName,
      avatarUrl,
      gamepasses: { halfCooldown },
      vipTrackable: false,
      badgesCount,
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
