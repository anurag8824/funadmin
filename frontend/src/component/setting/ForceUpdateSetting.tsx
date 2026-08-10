"use-client";
import Button from "@/extra/Button";
import Input from "@/extra/Input";
import { getSetting, updateForceUpdate } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { FormControlLabel, Switch } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

/**
 * Simple admin panel for Android force-update.
 * Saves via PATCH /admin/setting/updateForceUpdate (creates Setting doc if missing).
 */
const ForceUpdateSetting = () => {
  const dispatch = useAppDispatch();
  const { settingData, isLoading } = useSelector((state: RootStore) => state.setting);

  const [androidMinVersionCode, setAndroidMinVersionCode] = useState<string>("34");
  const [forceUpdateAndroid, setForceUpdateAndroid] = useState<boolean>(false);
  const [androidAppUrl, setAndroidAppUrl] = useState<string>(
    "https://play.google.com/store/apps/details?id=com.infayou.funtapp",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getSetting({} as any));
  }, [dispatch]);

  useEffect(() => {
    if (!settingData) return;
    setAndroidMinVersionCode(
      settingData?.androidMinVersionCode != null
        ? String(settingData.androidMinVersionCode)
        : "34",
    );
    setForceUpdateAndroid(!!settingData?.forceUpdateAndroid);
    setAndroidAppUrl(
      settingData?.androidAppUrl ||
        "https://play.google.com/store/apps/details?id=com.infayou.funtapp",
    );
  }, [settingData]);

  const handleSave = async () => {
    const code = parseInt(androidMinVersionCode, 10);
    if (!Number.isFinite(code) || code < 0) {
      toast.error("Enter a valid min versionCode (number).");
      return;
    }
    if (!androidAppUrl.trim()) {
      toast.error("Play Store URL is required.");
      return;
    }

    setSaving(true);
    try {
      const result: any = await dispatch(
        updateForceUpdate({
          androidMinVersionCode: code,
          forceUpdateAndroid,
          androidAppUrl: androidAppUrl.trim(),
        }),
      );
      const payload = result?.payload;
      if (payload?.status) {
        toast.success(payload.message || "Force update saved.");
        dispatch(getSetting({} as any));
      } else {
        toast.error(payload?.message || payload?.error || "Failed to save.");
      }
    } catch {
      toast.error("Failed to save force update setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payment-setting card1 p-0">
      <div className="cardHeader">
        <div className="align-items-center d-flex flex-wrap justify-content-between p-3">
          <div>
            <p className="m-0 fs-5 fw-medium">Android Force Update</p>
            <p className="m-0 mt-1 text-muted" style={{ fontSize: 13 }}>
              When enabled, users with versionCode lower than the minimum must update from Play Store.
            </p>
          </div>
          <Button
            btnName={saving ? "Saving…" : "Save"}
            type={"button"}
            onClick={handleSave}
            disabled={saving || isLoading}
            newClass={"submit-btn"}
            style={{
              borderRadius: "5px",
              width: "100px",
            }}
          />
        </div>
      </div>

      <div className="payment-setting-box p-3">
        <div className="row" style={{ maxWidth: 560 }}>
          <div className="col-12 withdrawal-input">
            <Input
              label={"Min Android versionCode"}
              name={"androidMinVersionCode"}
              type={"number"}
              value={androidMinVersionCode}
              placeholder={"e.g. 34 (current app is 34)"}
              onChange={(e: any) => setAndroidMinVersionCode(e.target.value)}
            />
          </div>

          <div className="col-12 withdrawal-input mt-3">
            <Input
              label={"Play Store URL"}
              name={"androidAppUrl"}
              type={"text"}
              value={androidAppUrl}
              placeholder={"https://play.google.com/store/apps/details?id=com.infayou.funtapp"}
              onChange={(e: any) => setAndroidAppUrl(e.target.value)}
            />
          </div>

          <div className="col-12 mt-3">
            <FormControlLabel
              control={
                <Switch
                  checked={forceUpdateAndroid}
                  onChange={() => setForceUpdateAndroid((v) => !v)}
                  color="error"
                />
              }
              label={
                forceUpdateAndroid
                  ? "Force update ON (blocks old apps)"
                  : "Force update OFF"
              }
            />
          </div>

          <div className="col-12 mt-3">
            <div
              className="p-3 rounded"
              style={{
                background: forceUpdateAndroid ? "rgba(220, 53, 69, 0.08)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${forceUpdateAndroid ? "rgba(220, 53, 69, 0.35)" : "rgba(0,0,0,0.08)"}`,
                fontSize: 13,
              }}
            >
              {forceUpdateAndroid ? (
                <>
                  Apps with <strong>versionCode &lt; {androidMinVersionCode || "—"}</strong> will
                  see a compulsory update screen and cannot continue.
                </>
              ) : (
                <>Force update is off. All app versions can open normally.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceUpdateSetting;
