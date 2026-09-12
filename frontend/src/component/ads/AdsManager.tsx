"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/extra/Button";
import Input from "@/extra/Input";
import ToggleSwitch from "@/extra/ToggleSwitch";
import Table from "@/extra/Table";
import { apiInstance } from "@/util/ApiInstance";
import { setToast } from "@/util/toastServices";

const SURFACES = ["feed", "reels", "chatList", "story"];
const AD_UNIT_ID_REGEX = /^ca-app-pub-\d+\/\d+$/;

type Placement = {
  surface: string;
  configured: boolean;
  enabled: boolean;
  killed: boolean;
  density: number;
  houseFillRatio: number;
  android?: { native?: string; banner?: string; interstitial?: string };
  ios?: { native?: string; banner?: string; interstitial?: string };
};

type Creative = {
  _id: string;
  headline: string;
  body?: string;
  callToAction?: string;
  clickUrl: string;
  mediaUrl?: string;
  format: string;
  reviewStatus: "pending" | "approved" | "rejected";
};

type Campaign = {
  _id: string;
  name: string;
  advertiser: string;
  status: "draft" | "active" | "paused" | "completed";
  priority: number;
  capPerUserPerDay: number;
  impressionGoal: number;
  pacing: "even" | "asap";
  creatives: Creative[];
};

type SurfaceStat = {
  surface: string;
  fillRate: number;
  impressionRatio: number;
  viewabilityRate: number;
  events: Record<string, number>;
};

const TABS = ["Placements", "Campaigns", "Performance"];

export default function AdsManager() {
  const [tab, setTab] = useState("Placements");

  return (
    <div className="adsManager" style={{ padding: 20 }}>
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map((name) => (
          <Button
            key={name}
            btnName={name}
            btnColor={tab === name ? "btnBlackPrime" : "btnWhitePrime"}
            onClick={() => setTab(name)}
          />
        ))}
      </div>

      {tab === "Placements" && <PlacementsPanel />}
      {tab === "Campaigns" && <CampaignsPanel />}
      {tab === "Performance" && <PerformancePanel />}
    </div>
  );
}

// ── Placements ────────────────────────────────────────────────────────────────

function PlacementsPanel() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [minDensity, setMinDensity] = useState(5);
  const [redisReady, setRedisReady] = useState(true);
  const [saving, setSaving] = useState("");

  const load = useCallback(() => {
    apiInstance
      .get("admin/ads/placements")
      .then((res: any) => {
        if (!res?.status) return;
        setPlacements(res.data?.placements || []);
        setMinDensity(res.data?.minDensity ?? 5);
        setRedisReady(Boolean(res.data?.redisReady));
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(load, [load]);

  const patch = (surface: string, body: Record<string, unknown>) => {
    setSaving(surface);
    apiInstance
      .patch("admin/ads/placement", { surface, ...body })
      .then((res: any) => {
        setSaving("");
        if (!res?.status) {
          setToast("error", res?.message || "Could not save placement");
          return;
        }
        setToast("success", "Placement saved");
        load();
      })
      .catch(() => {
        setSaving("");
        setToast("error", "Could not save placement");
      });
  };

  const toggleKill = (surface: string, killed: boolean) => {
    apiInstance
      .patch("admin/ads/kill", { surface, killed })
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not apply kill switch");
          return;
        }
        setToast("success", killed ? `${surface} ads stopped` : `${surface} ads resumed`);
        load();
      })
      .catch(() => setToast("error", "Could not apply kill switch"));
  };

  return (
    <div>
      {!redisReady && (
        <div className="alert alert-warning">
          The counter store is unreachable, so frequency caps are counted per server instance and
          kill switches will not apply. Check <code>REDIS_URL</code>.
        </div>
      )}

      <p className="text-muted">
        Density is the number of organic items between two ads. The floor is {minDensity} — ads any
        closer together read as ad-dense and put the AdMob account at risk.
      </p>

      {placements.map((placement) => (
        <PlacementRow
          key={placement.surface}
          placement={placement}
          minDensity={minDensity}
          saving={saving === placement.surface}
          onSave={(body) => patch(placement.surface, body)}
          onToggleKill={(killed) => toggleKill(placement.surface, killed)}
        />
      ))}
    </div>
  );
}

function PlacementRow({
  placement,
  minDensity,
  saving,
  onSave,
  onToggleKill,
}: {
  placement: Placement;
  minDensity: number;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onToggleKill: (killed: boolean) => void;
}) {
  const [density, setDensity] = useState(String(placement.density));
  const [houseRatio, setHouseRatio] = useState(String(placement.houseFillRatio));
  const [androidNative, setAndroidNative] = useState(placement.android?.native || "");
  const [iosNative, setIosNative] = useState(placement.ios?.native || "");
  const [error, setError] = useState("");

  const save = () => {
    const densityNum = parseInt(density, 10);
    if (!Number.isFinite(densityNum) || densityNum < minDensity) {
      setError(`Density must be at least ${minDensity}.`);
      return;
    }
    const ratioNum = Number(houseRatio);
    if (!Number.isFinite(ratioNum) || ratioNum < 0 || ratioNum > 1) {
      setError("House fill ratio must be between 0 and 1.");
      return;
    }
    for (const [value, label] of [
      [androidNative, "Android native unit"],
      [iosNative, "iOS native unit"],
    ] as const) {
      if (value.trim() && !AD_UNIT_ID_REGEX.test(value.trim())) {
        setError(`${label} must look like ca-app-pub-XXXXXXXX/YYYYYYYYYY.`);
        return;
      }
    }
    setError("");
    onSave({
      density: densityNum,
      houseFillRatio: ratioNum,
      android: { native: androidNative.trim() },
      ios: { native: iosNative.trim() },
    });
  };

  return (
    <div className="card mb-3" style={{ padding: 16 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h6 className="m-0 text-capitalize">{placement.surface}</h6>
          <small className="text-muted">
            {placement.configured ? "Configured" : "Not configured — using legacy app settings"}
          </small>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <label className="d-flex align-items-center gap-2 m-0">
            <span>Enabled</span>
            <ToggleSwitch
              value={placement.enabled}
              onChange={() => onSave({ enabled: !placement.enabled })}
            />
          </label>
          <Button
            btnName={placement.killed ? "Resume ads" : "Stop ads now"}
            btnColor={placement.killed ? "btnBlackPrime" : "btnWhitePrime"}
            onClick={() => onToggleKill(!placement.killed)}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <Input
            label="Items between ads"
            type="number"
            value={density}
            onChange={(e: any) => setDensity(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Input
            label="House fill ratio (0–1)"
            type="number"
            value={houseRatio}
            onChange={(e: any) => setHouseRatio(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Input
            label="Android native unit"
            type="text"
            value={androidNative}
            placeholder="ca-app-pub-…/…"
            onChange={(e: any) => setAndroidNative(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Input
            label="iOS native unit"
            type="text"
            value={iosNative}
            placeholder="ca-app-pub-…/…"
            onChange={(e: any) => setIosNative(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="text-danger mb-2">{error}</div>}
      <div>
        <Button btnName={saving ? "Saving…" : "Save"} btnColor="btnBlackPrime" disabled={saving} onClick={save} />
      </div>
    </div>
  );
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

const EMPTY_CAMPAIGN = { name: "", advertiser: "FuntApp", capPerUserPerDay: 3, impressionGoal: 0 };
const EMPTY_CREATIVE = { headline: "", body: "", callToAction: "Learn more", clickUrl: "", mediaUrl: "" };

function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [draft, setDraft] = useState({ ...EMPTY_CAMPAIGN });
  const [creativeDraft, setCreativeDraft] = useState<Record<string, typeof EMPTY_CREATIVE>>({});

  const load = useCallback(() => {
    apiInstance
      .get("admin/ads/campaigns")
      .then((res: any) => {
        if (res?.status) setCampaigns(res.data || []);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(load, [load]);

  const createCampaign = () => {
    if (!draft.name.trim()) {
      setToast("error", "Campaign needs a name");
      return;
    }
    apiInstance
      .post("admin/ads/campaign", draft)
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not create campaign");
          return;
        }
        setToast("success", "Campaign created");
        setDraft({ ...EMPTY_CAMPAIGN });
        load();
      })
      .catch(() => setToast("error", "Could not create campaign"));
  };

  const patchCampaign = (campaignId: string, body: Record<string, unknown>) => {
    apiInstance
      .patch("admin/ads/campaign", { campaignId, ...body })
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not update campaign");
          return;
        }
        load();
      })
      .catch(() => setToast("error", "Could not update campaign"));
  };

  const removeCampaign = (campaignId: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all of its creatives? This cannot be undone.`)) return;
    apiInstance
      .delete(`admin/ads/campaign?campaignId=${campaignId}`)
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not delete campaign");
          return;
        }
        setToast("success", "Campaign deleted");
        load();
      })
      .catch(() => setToast("error", "Could not delete campaign"));
  };

  const addCreative = (campaignId: string) => {
    const body = creativeDraft[campaignId] || EMPTY_CREATIVE;
    if (!body.headline.trim() || !body.clickUrl.trim()) {
      setToast("error", "A creative needs a headline and a click URL");
      return;
    }
    apiInstance
      .post("admin/ads/creative", { campaignId, ...body })
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not add creative");
          return;
        }
        setToast("success", "Creative added — pending review");
        setCreativeDraft((prev) => ({ ...prev, [campaignId]: { ...EMPTY_CREATIVE } }));
        load();
      })
      .catch(() => setToast("error", "Could not add creative"));
  };

  const reviewCreative = (creativeId: string, reviewStatus: string) => {
    apiInstance
      .patch("admin/ads/creative", { creativeId, reviewStatus })
      .then((res: any) => {
        if (!res?.status) {
          setToast("error", res?.message || "Could not update creative");
          return;
        }
        load();
      })
      .catch(() => setToast("error", "Could not update creative"));
  };

  return (
    <div>
      <div className="card mb-4" style={{ padding: 16 }}>
        <h6>New campaign</h6>
        <div className="row">
          <div className="col-md-4">
            <Input
              label="Name"
              type="text"
              value={draft.name}
              onChange={(e: any) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <Input
              label="Advertiser"
              type="text"
              value={draft.advertiser}
              onChange={(e: any) => setDraft({ ...draft, advertiser: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Input
              label="Cap / user / day"
              type="number"
              value={draft.capPerUserPerDay}
              onChange={(e: any) => setDraft({ ...draft, capPerUserPerDay: Number(e.target.value) })}
            />
          </div>
          <div className="col-md-3">
            <Input
              label="Impression goal (0 = unlimited)"
              type="number"
              value={draft.impressionGoal}
              onChange={(e: any) => setDraft({ ...draft, impressionGoal: Number(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <Button btnName="Create campaign" btnColor="btnBlackPrime" onClick={createCampaign} />
        </div>
      </div>

      {campaigns.length === 0 && <p className="text-muted">No campaigns yet.</p>}

      {campaigns.map((campaign) => {
        const approved = campaign.creatives.filter((c) => c.reviewStatus === "approved").length;
        const cDraft = creativeDraft[campaign._id] || EMPTY_CREATIVE;
        return (
          <div className="card mb-3" key={campaign._id} style={{ padding: 16 }}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <h6 className="m-0">{campaign.name}</h6>
                <small className="text-muted">
                  {campaign.advertiser} · cap {campaign.capPerUserPerDay}/user/day ·{" "}
                  {approved} of {campaign.creatives.length} creatives approved
                </small>
                {campaign.status === "active" && approved === 0 && (
                  <div className="text-danger">
                    <small>Active but no approved creative — this campaign cannot fill a slot.</small>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select
                  className="form-select"
                  style={{ width: 130 }}
                  value={campaign.status}
                  onChange={(e) => patchCampaign(campaign._id, { status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                <Button
                  btnName="Delete"
                  btnColor="btnWhitePrime"
                  onClick={() => removeCampaign(campaign._id, campaign.name)}
                />
              </div>
            </div>

            <hr />

            {campaign.creatives.map((creative) => (
              <div
                key={creative._id}
                className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2"
              >
                <div>
                  <strong>{creative.headline}</strong>
                  <div>
                    <small className="text-muted">
                      {creative.format} · {creative.clickUrl}
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span
                    className={`badge ${
                      creative.reviewStatus === "approved"
                        ? "bg-success"
                        : creative.reviewStatus === "rejected"
                        ? "bg-danger"
                        : "bg-secondary"
                    }`}
                  >
                    {creative.reviewStatus}
                  </span>
                  {creative.reviewStatus !== "approved" && (
                    <Button
                      btnName="Approve"
                      btnColor="btnBlackPrime"
                      onClick={() => reviewCreative(creative._id, "approved")}
                    />
                  )}
                  {creative.reviewStatus !== "rejected" && (
                    <Button
                      btnName="Reject"
                      btnColor="btnWhitePrime"
                      onClick={() => reviewCreative(creative._id, "rejected")}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="row mt-2">
              <div className="col-md-3">
                <Input
                  label="Headline"
                  type="text"
                  value={cDraft.headline}
                  onChange={(e: any) =>
                    setCreativeDraft((p) => ({
                      ...p,
                      [campaign._id]: { ...cDraft, headline: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="col-md-3">
                <Input
                  label="Body"
                  type="text"
                  value={cDraft.body}
                  onChange={(e: any) =>
                    setCreativeDraft((p) => ({
                      ...p,
                      [campaign._id]: { ...cDraft, body: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <Input
                  label="CTA"
                  type="text"
                  value={cDraft.callToAction}
                  onChange={(e: any) =>
                    setCreativeDraft((p) => ({
                      ...p,
                      [campaign._id]: { ...cDraft, callToAction: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <Input
                  label="Click URL"
                  type="text"
                  value={cDraft.clickUrl}
                  placeholder="funtapp://coins"
                  onChange={(e: any) =>
                    setCreativeDraft((p) => ({
                      ...p,
                      [campaign._id]: { ...cDraft, clickUrl: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <Input
                  label="Media URL"
                  type="text"
                  value={cDraft.mediaUrl}
                  onChange={(e: any) =>
                    setCreativeDraft((p) => ({
                      ...p,
                      [campaign._id]: { ...cDraft, mediaUrl: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Button
                btnName="Add creative"
                btnColor="btnBlackPrime"
                onClick={() => addCreative(campaign._id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Performance ───────────────────────────────────────────────────────────────

function PerformancePanel() {
  const [stats, setStats] = useState<SurfaceStat[]>([]);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    apiInstance
      .get(`admin/ads/stats?hours=${hours}`)
      .then((res: any) => {
        if (res?.status) setStats(res.data?.surfaces || []);
      })
      .catch((err) => console.log(err));
  }, [hours]);

  const statsTable = [
    { Header: "Surface", Cell: ({ row }: any) => <span className="text-capitalize">{row.surface}</span> },
    {
      Header: "Fill rate",
      Cell: ({ row }: any) => <span>{(row.fillRate * 100).toFixed(1)}%</span>,
    },
    {
      // The metric that predicts an AdMob account action, so it is flagged rather than listed.
      Header: "Request → impression",
      Cell: ({ row }: any) => (
        <span className={row.impressionRatio < 0.7 ? "text-danger fw-bold" : ""}>
          {(row.impressionRatio * 100).toFixed(1)}%
          {row.impressionRatio < 0.7 ? " ⚠" : ""}
        </span>
      ),
    },
    {
      Header: "Viewability",
      Cell: ({ row }: any) => (
        <span className={row.viewabilityRate < 0.6 ? "text-danger" : ""}>
          {(row.viewabilityRate * 100).toFixed(1)}%
        </span>
      ),
    },
    { Header: "Requested", Cell: ({ row }: any) => <span>{row.events?.requested || 0}</span> },
    { Header: "Rendered", Cell: ({ row }: any) => <span>{row.events?.rendered || 0}</span> },
    { Header: "Viewable", Cell: ({ row }: any) => <span>{row.events?.viewable || 0}</span> },
    { Header: "Clicked", Cell: ({ row }: any) => <span>{row.events?.clicked || 0}</span> },
    { Header: "No fill", Cell: ({ row }: any) => <span>{row.events?.nofill || 0}</span> },
  ];

  return (
    <div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[24, 72, 168].map((h) => (
          <Button
            key={h}
            btnName={h === 24 ? "Last 24h" : `Last ${h / 24}d`}
            btnColor={hours === h ? "btnBlackPrime" : "btnWhitePrime"}
            onClick={() => setHours(h)}
          />
        ))}
      </div>

      <p className="text-muted">
        Request → impression below 70% is the signal AdMob acts on. Investigate the surface before
        Google does.
      </p>

      {stats.length === 0 ? (
        <p className="text-muted">No ad events recorded in this window.</p>
      ) : (
        <Table data={stats} mapData={statsTable} type="client" />
      )}
    </div>
  );
}
