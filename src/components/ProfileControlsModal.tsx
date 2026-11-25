import { useState } from 'react';
import { Download, Plus, Search, Trash2, Upload, UserCheck, X } from 'lucide-react';
import { evaluateRobloxOgStatus } from '../core/spts';
import { useT } from '../i18n';
import {
  createDefaultProfile,
  useAppStore,
  type RobloxClassicBadgeInfo
} from '../store/useAppStore';

interface ProfileControlsModalProps {
  open: boolean;
  onClose: () => void;
}

interface RobloxLookupResponse {
  userId: number;
  username: string;
  displayName: string;
  createdAt?: string | null;
  avatarUrl: string | null;
  gamepasses: { halfCooldown: boolean };
  badgesCount: number;
  classicBadges?: RobloxClassicBadgeInfo[];
  earliestClassicBadgeDate?: string | null;
  error?: string;
}

export function ProfileControlsModal({ open, onClose }: ProfileControlsModalProps) {
  const t = useT();
  const {
    profiles,
    activeProfileId,
    isIncognito,
    switchProfile,
    addProfile,
    deleteProfile,
    saveIncognitoAsProfile,
    exportActiveProfileJson,
    exportActiveProfileShareCode,
    importProfileData
  } = useAppStore();

  const [newName, setNewName] = useState('');
  const [robloxQuery, setRobloxQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<RobloxLookupResponse | null>(null);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!open) return null;

  const handleRobloxLookup = async () => {
    const query = robloxQuery.trim();
    if (!query) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/roblox-user?query=${encodeURIComponent(query)}`);
      const data = (await res.json()) as RobloxLookupResponse;
      if (!res.ok || data.error) {
        setLookupError(data.error || t.profiles.lookupUnavailable);
      } else {
        setLookupResult(data);
        if (!newName.trim()) {
          setNewName(data.displayName || data.username);
        }
      }
    } catch {
      setLookupError(t.profiles.lookupUnreachable);
    } finally {
      setLookupLoading(false);
    }
  };

  const lookupOg = lookupResult
    ? evaluateRobloxOgStatus({
        accountCreatedAt: lookupResult.createdAt,
        badgeAwardedDates: lookupResult.classicBadges?.map((b) => b.awardedDate) ?? [
          lookupResult.earliestClassicBadgeDate
        ]
      })
    : null;

  const handleCreateProfile = () => {
    const name = newName.trim() || lookupResult?.displayName || `Alt ${profiles.length + 1}`;
    const base = createDefaultProfile(`profile-${Date.now().toString(36)}`, name);
    if (lookupResult) {
      base.robloxUsername = lookupResult.username;
      base.robloxUserId = lookupResult.userId;
      base.avatarUrl = lookupResult.avatarUrl;
      base.robloxCreatedAt = lookupResult.createdAt ?? null;
      base.robloxClassicEarliestBadgeAt = lookupResult.earliestClassicBadgeDate ?? null;
      base.robloxClassicBadges = lookupResult.classicBadges ?? [];
      base.spts.halfCooldownPass = lookupResult.gamepasses.halfCooldown;
      if (lookupOg) {
        base.spts.isOgPlayer = lookupOg.suggestedIsOg;
        if (lookupOg.suggestedStartYear !== null) {
          base.spts.classicStartYear = String(lookupOg.suggestedStartYear);
        }
      }
    }
    addProfile(base);
    setNewName('');
    setRobloxQuery('');
    setLookupResult(null);
    setLookupError(null);
    onClose();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg(t.profiles.copiedLabel);
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch {
      setCopiedMsg(t.profiles.copyBlocked);
    }
  };

  const handleImport = () => {
    const res = importProfileData(importText);
    if (res.ok) {
      setImportStatus({ ok: true, msg: t.profiles.importSuccess });
      setImportText('');
    } else {
      setImportStatus({ ok: false, msg: t.profiles.importError });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-t-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-2xl sm:rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{t.profiles.title}</h2>
            <p className="text-xs text-[var(--text-secondary)]">{t.profiles.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isIncognito && (
          <div className="mb-4 rounded-[var(--radius-control)] border border-[var(--accent)]/40 bg-[var(--bg-elevated)] p-3">
            <div className="mb-2 text-sm font-semibold">{t.profiles.incognitoBannerTitle}</div>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">{t.profiles.incognitoBannerDesc}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.profiles.incognitoNamePlaceholder}
                className="min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  saveIncognitoAsProfile(newName || t.nav.incognito);
                  setNewName('');
                  onClose();
                }}
                className="min-h-[44px] shrink-0 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">{t.profiles.savedProfiles}</div>
          <div className="space-y-2">
            {profiles.map((profile) => {
              const active = !isIncognito && profile.id === activeProfileId;
              const confirmingDelete = pendingDeleteId === profile.id;
              return (
                <div
                  key={profile.id}
                  className={`rounded-[var(--radius-control)] border px-3 py-2 ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--bg-elevated)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDeleteId(null);
                        switchProfile(profile.id);
                        onClose();
                      }}
                      className="flex min-h-[40px] min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded-full border border-[var(--border-subtle)] object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-bold">
                          {profile.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{profile.name}</div>
                        <div className="truncate text-xs text-[var(--text-secondary)]">
                          {profile.robloxUsername ? `@${profile.robloxUsername} · ` : ''}
                          FS {profile.spts.stats.FS || '—'} · {profile.spts.tokens || '—'} {t.common.tokens}
                        </div>
                      </div>
                    </button>

                    {profiles.length > 1 && !confirmingDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(profile.id)}
                        aria-label={`${t.common.delete} ${profile.name}`}
                        className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {confirmingDelete && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-xs">
                      <span className="font-medium text-red-400">
                        {t.profiles.confirmDeleteMsg.replace('{name}', profile.name)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="min-h-[32px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-2.5 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteProfile(profile.id);
                            setPendingDeleteId(null);
                          }}
                          className="min-h-[32px] rounded-[var(--radius-control)] bg-red-600 px-3 font-semibold text-white hover:bg-red-500"
                        >
                          {t.common.confirm}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-5 border-t border-[var(--border-subtle)] pt-4">
          <div className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">{t.profiles.addNewTitle}</div>
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              value={robloxQuery}
              onChange={(e) => setRobloxQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && robloxQuery.trim()) {
                  e.preventDefault();
                  void handleRobloxLookup();
                }
              }}
              placeholder={t.profiles.robloxPlaceholder}
              className="min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm"
            />
            <button
              type="button"
              onClick={handleRobloxLookup}
              disabled={lookupLoading || !robloxQuery.trim()}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-semibold disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {lookupLoading ? t.profiles.checking : t.profiles.fetchRoblox}
            </button>
          </div>

          {lookupError && <p className="mb-2 text-xs text-amber-400">{lookupError}</p>}

          {lookupResult && (
            <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-control)] border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
              {lookupResult.avatarUrl && (
                <img
                  src={lookupResult.avatarUrl}
                  alt={lookupResult.displayName}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{lookupResult.displayName}</span>
                  <span className="text-[var(--text-secondary)]">@{lookupResult.username}</span>
                </div>
                <div className="text-[var(--text-secondary)]">
                  ID {lookupResult.userId} · {t.spts.halfCooldownShort}:{' '}
                  {lookupResult.gamepasses.halfCooldown ? t.common.owned : t.common.notOwned}
                </div>
                {lookupOg && (
                  <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {lookupOg.status === 'confirmed_badge' &&
                      `${t.spts.trophyOgConfirmedBadge} (${lookupOg.earliestBadgeYear ?? ''})`}
                    {lookupOg.status === 'possible_account_age' &&
                      `${t.spts.trophyOgPossibleAccount} (${lookupOg.accountCreatedYear ?? ''})`}
                    {lookupOg.status === 'not_og_new_account' && t.spts.trophyOgPostLaunch}
                  </div>
                )}
                <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]/80">{t.profiles.vipNote}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.profiles.profileNamePlaceholder}
              className="min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 text-sm"
            />
            <button
              type="button"
              onClick={handleCreateProfile}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)]"
            >
              <Plus className="h-4 w-4" />
              {t.profiles.create}
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{t.profiles.exportImportTitle}</span>
            {copiedMsg && <span className="text-xs text-emerald-400">{copiedMsg}</span>}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleCopy(exportActiveProfileShareCode())}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-semibold"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.profiles.copyShareCode}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleCopy(exportActiveProfileJson())}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-semibold"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.profiles.copyJson}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t.profiles.importPlaceholder}
              className="min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 font-mono text-xs"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-semibold disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {t.profiles.importBtn}
            </button>
          </div>
          {importStatus && (
            <p className={`mt-1.5 text-xs ${importStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {importStatus.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
