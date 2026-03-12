import Button from "@/extra/Button";
import Input, { Textarea } from "@/extra/Input";
import {
  adSettingSwitch,
  getSetting,
  settingSwitch,
  updateSetting,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { useTheme } from "@emotion/react";
import { FormControlLabel, Switch, Typography, styled } from "@mui/material";
import React, { useEffect, useState } from "react";
import Multiselect from "multiselect-react-dropdown";
import { useSelector } from "react-redux";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";


const MaterialUISwitch = styled(Switch)<{ theme: ThemeType }>(({ theme }) => ({
  width: "67px",
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    top: "8px",
    transform: "translateX(10px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(40px)",
      top: "8px",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.5992 5.06724L16.5992 5.06719C16.396 4.86409 16.1205 4.75 15.8332 4.75C15.546 4.75 15.2705 4.86409 15.0673 5.06719L15.0673 5.06721L7.91657 12.2179L4.93394 9.23531C4.83434 9.13262 4.71537 9.05067 4.58391 8.9942C4.45174 8.93742 4.30959 8.90754 4.16575 8.90629C4.0219 8.90504 3.87925 8.93245 3.74611 8.98692C3.61297 9.04139 3.49202 9.12183 3.3903 9.22355C3.28858 9.32527 3.20814 9.44622 3.15367 9.57936C3.0992 9.7125 3.07179 9.85515 3.07304 9.99899C3.07429 10.1428 3.10417 10.285 3.16095 10.4172C3.21742 10.5486 3.29937 10.6676 3.40205 10.7672L7.15063 14.5158L7.15066 14.5158C7.35381 14.7189 7.62931 14.833 7.91657 14.833C8.20383 14.833 8.47933 14.7189 8.68249 14.5158L8.68251 14.5158L16.5992 6.5991L16.5992 6.59907C16.8023 6.39592 16.9164 6.12042 16.9164 5.83316C16.9164 5.54589 16.8023 5.27039 16.5992 5.06724Z" fill="white" stroke="white" strokeWidth="0.5"/></svg>')`,
      },
    },
    "& + .MuiSwitch-track": {
      opacity: 1,
      backgroundColor: theme === "dark" ? "#8796A5" : "#FCF3F4",
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme === "dark" ? "#0FB515" : "red",
    width: 24,
    height: 24,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.1665 5.83301L5.83325 14.1663" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><path d="M5.83325 5.83301L14.1665 14.1663" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: "52px",
    border: "0.5px solid rgba(0, 0, 0, 0.14)",
    background: " #FFEDF0",
    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.08) inset",
    opacity: 1,
    width: "79px",
    height: "28px",
  },
}));

type ThemeType = "dark" | "light";

const AdSetting = () => {
  const { settingData } = useSelector((state: RootStore) => state.setting);

    



  const dispatch = useAppDispatch();
  const [data, setData] = useState<any>();

  const [androidGoogleInterstitial, setAndroidGoogleInterstitial] =
    useState("");
  const [googleNative, setGoogleNative] = useState();
  const [iosInterstital, setIosInterstial] = useState();
  const [iosNative, setIosNative] = useState();
  const [isGoogle, setIsGoogle] = useState();
  const [adDisplayIndex, setAdDisplayIndex] = useState();
  const [isVideoAdEnabled, setIsVideoEnable] = useState<boolean>();
  const [isFeedAdEnabled, setIsFeedAdEnabled] = useState<boolean>();
  const [isChatAdEnabled, setIsChatAdEnabled] = useState<boolean>();
  const [isLiveStreamBackButtonAdEnabled, setIsLiveStreamBackButtonAdEnabled] =
    useState<boolean>();
  const [isChatBackButtonAdEnabled, setIsChatBackButtonAdEnabled] = useState();

  useClearSessionStorageOnPopState("multiButton");

  const theme: any = useTheme() as ThemeType; // Using useTheme hook and type assertion to cast Theme to ThemeType

  useEffect(() => {
    const payload: any = {};
      dispatch(getSetting(payload));
  }, []);

  useEffect(() => {
    setData(settingData);
  }, [settingData]);

  useEffect(() => {
    setAndroidGoogleInterstitial(data?.android?.google?.interstitial);
    setGoogleNative(data?.android?.google?.native);
    setIosInterstial(data?.ios?.google?.interstitial);
    setIosNative(data?.ios?.google?.native);
    setIsGoogle(data?.isGoogle);
    setIsVideoEnable(data?.isVideoAdEnabled);
    setIsFeedAdEnabled(data?.isFeedAdEnabled);
    setIsChatAdEnabled(data?.isChatAdEnabled);
    setIsLiveStreamBackButtonAdEnabled(data?.isLiveStreamBackButtonAdEnabled);
    setIsChatBackButtonAdEnabled(data?.isChatBackButtonAdEnabled);
    setAdDisplayIndex(data?.adDisplayIndex);
  }, [data]);

  const handleChange = (type) => {
    
    const payload: any = {
      settingId: settingData?._id,
      type: type,
    };
    dispatch(adSettingSwitch(payload));
  };

  const handleSubmit = () => {

    

    const settingDataAd = {
      androidGoogleInterstitial: androidGoogleInterstitial,
      androidGoogleNative: googleNative,
      iosGoogleNative: iosNative,
      iosGoogleInterstitial: iosInterstital,
      adDisplayIndex: adDisplayIndex,
    };

    const payload: any = {
      data: settingDataAd,
      settingId: settingData?._id,
    };

    dispatch(updateSetting(payload));
  };

  return (
    <>
      <div className="payment-setting-box p-0 card1 ">
        <div className="cardHeader">
          <div className=" align-items-center d-flex flex-wrap justify-content-between p-3">
            <div>
              <p className="m-0 fs-5 fw-medium">Ads Setting</p>
            </div>
            <Button
              btnName={"Submit"}
              type={"button"}
              onClick={handleSubmit}
              newClass={"submit-btn"}
              style={{
                borderRadius: "0.5rem",
                width: "88px",
                marginLeft: "10px",
              }}
            />
          </div>
        </div>
        {/* <div className="row align-items-center mb-2 p-2">
          <div className="col-6 col-sm-6 ">
            <h5 className="m-0">Google Ads Setting</h5>
          </div>

          <div className="col-6 col-sm-6 ">
            <h5 className="m-0">Ads switch setting</h5>
          </div>
        </div> */}
        <div className="row flex-wrap payment-setting setting p-3">
          <div className="col-6 col-lg-6">
            <div className="mb-4">
              <div className="withdrawal-box border payment-box" >
                <h6 className="border-bottom pb-3">Google Ads Setting</h6>
                <div className="row">
                  <div className="col-12 mt-1 d-flex justify-content-between align-items-center">
                    <button className="payment-content-button">
                      <span>Google Ad (enable/disable googel ads in app)</span>
                    </button>
                    <FormControlLabel
                      control={
                        <MaterialUISwitch
                          sx={{ m: 1 }}
                          checked={isGoogle === true ? true : false}
                          theme={theme}
                        />
                      }
                      label=""
                      onClick={() => handleChange("isGoogle")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="withdrawal-box payment-box" >
                <h6>Android</h6>
                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"Android Google Interstitial"}
                    name={"androidGoogleInterstitial"}
                    type={"text"}
                    value={androidGoogleInterstitial}
                    placeholder={"Android Google Interstitial"}
                    // errorMessage={
                    //   error.androidGoogleInterstitial &&
                    //   error.androidGoogleInterstitial
                    // }
                    // placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      setAndroidGoogleInterstitial(e.target.value);
                    }}
                  />
                </div>
                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"Android Google Native"}
                    name={"androidGoogleNative"}
                    type={"text"}
                    value={googleNative}
                    placeholder={"Google Native"}
                    // errorMessage={
                    //   error.androidGoogleNative && error.androidGoogleNative
                    // }
                    // placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      setGoogleNative(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-6">
            <div className="mb-4">
              <div className="withdrawal-box border payment-box">
                <h6 className="border-bottom pb-3">Ads switch setting</h6>
                <div className="row">
                  <div className="col-12 flex-wrap mt-1 d-flex justify-content-between align-items-center">
                    <div className="col-12 d-flex justify-content-between align-items-center border-bottom">
                      <label className="custom-input label m-0">
                        Ad position in video(on/off)
                      </label>
                      <FormControlLabel
                        control={
                          <MaterialUISwitch
                            sx={{ m: 1 }}
                            checked={isVideoAdEnabled === true ? true : false}
                            theme={theme}
                          />
                        }
                        label=""
                        onClick={() => handleChange("isVideoAdEnabled")}
                      />
                    </div>

                    <div className="col-12 d-flex justify-content-between align-items-center border-bottom">
                      <label className="custom-input label m-0">
                        Ad position in Feed (on / off)
                      </label>
                      <FormControlLabel
                        control={
                          <MaterialUISwitch
                            sx={{ m: 1 }}
                            checked={isFeedAdEnabled === true ? true : false}
                            theme={theme}
                          />
                        }
                        label=""
                        onClick={() => handleChange("isFeedAdEnabled")}
                      />
                    </div>

                    <div className="col-12 d-flex justify-content-between align-items-center border-bottom">
                      <label className="custom-input label m-0">
                        <span>Ad position in chat (On/off)</span>
                      </label>
                      <FormControlLabel
                        control={
                          <MaterialUISwitch
                            sx={{ m: 1 }}
                            checked={isChatAdEnabled === true ? true : false}
                            theme={theme}
                          />
                        }
                        label=""
                        onClick={() => handleChange("isChatAdEnabled")}
                      />
                    </div>

                    <div className="col-12 d-flex justify-content-between align-items-center border-bottom">
                      <label className="custom-input label m-0">
                        <span>Live streaming back button ad (on/off)</span>
                      </label>
                      <FormControlLabel
                        control={
                          <MaterialUISwitch
                            sx={{ m: 1 }}
                            checked={
                              isLiveStreamBackButtonAdEnabled === true
                                ? true
                                : false
                            }
                            theme={theme}
                          />
                        }
                        label=""
                        onClick={() =>
                          handleChange("isLiveStreamBackButtonAdEnabled")
                        }
                      />
                    </div>

                    <div className="col-12 d-flex justify-content-between align-items-center">
                      <label className="custom-input label m-0">
                        <span>Chat back button ads (On/off)</span>
                      </label>
                      <FormControlLabel
                        control={
                          <MaterialUISwitch
                            sx={{ m: 1 }}
                            checked={
                              isChatBackButtonAdEnabled === true ? true : false
                            }
                            theme={theme}
                          />
                        }
                        label=""
                        onClick={() =>
                          handleChange("isChatBackButtonAdEnabled")
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="payment-setting row p-3">
          <div className="col-md-6">
            <div className="mb-4">
              <div className="withdrawal-box payment-box" >
                <h6>IOS</h6>
                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"IOS Google Interstitial"}
                    name={"iosGoogleInterstitial"}
                    type={"text"}
                    value={iosInterstital}
                    placeholder={"IOS Google Interstitial"}
                    // errorMessage={
                    //   error.iosGoogleInterstitial && error.iosGoogleInterstitial
                    // }
                    // placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      setIosInterstial(e.target.value);
                    }}
                  />
                </div>
                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"IOS Google Native"}
                    name={"iosGoogleNative"}
                    type={"text"}
                    value={iosNative}
                     placeholder={"IOS GGoogle Native"}
                    // errorMessage={
                    //   error.iosGoogleNative && error.iosGoogleNative
                    // }
                    // placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      setIosNative(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-4">
              <div className="withdrawal-box payment-box" >
                <h6>Ads Displayed After a Variable Number of Videos</h6>
                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"Ad Display Frequency (Number of Videos)"}
                    name={"iosGoogleInterstitial"}
                    type={"text"}
                    value={adDisplayIndex}
                     placeholder={"Ad Display Frequency (Number of Videos)"}
                    // errorMessage={
                    //   error.iosGoogleInterstitial && error.iosGoogleInterstitial
                    // }
                    // placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      setAdDisplayIndex(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdSetting;
