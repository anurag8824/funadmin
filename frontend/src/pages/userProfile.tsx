import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
import { RootStore, useAppDispatch } from "@/store/store";
import { getUserProfile } from "@/store/userSlice";
import Button from "@/extra/Button";
import AvatarSetting from "@/component/user/AvatarSetting";
import NewTitle from "@/extra/Title";
import RootLayout from "@/component/layout/Layout";
import { closeDialog } from "@/store/dialogSlice";
import { IconChevronCompactLeft } from "@tabler/icons-react";

const userProfile = (props: any) => {
  const [multiButtonSelect, setMultiButtonSelect] = useState<string>("Profile");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [data, setData] = useState<any>();
  const labelData: string[] = ["Profile", "Avatar"];
  const { dialogueType, dialogueData } = useSelector(
    (state: any) => state.dialogue
  );

  const id = router.query.id;
  
  
  const getDialogDataGet =
    typeof window !== "undefined" &&
    JSON.parse(localStorage.getItem("dialogueData"));

  const { getUserProfileData } = useSelector((state: any) => state.user);

  const handleAlignment = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null
  ) => {
    if (newAlignment !== null && newAlignment !== undefined) {
      setMultiButtonSelect(newAlignment);
    }
  };

  const handleClose = () => {
    if (dialogueData) {
      dispatch(closeDialog());
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (dialogueData) {
      if (dialogueType == "managePost") {
        const payload: any = {
          id: dialogueData?.userId,
        };
        dispatch(getUserProfile(payload));
      } else {
        const payload: any = {
          id: dialogueData?._id,
        };
        dispatch(getUserProfile(payload));
      }
    } else if (id) {
      const payload: any = {
        id: id,
      };
      dispatch(getUserProfile(payload));
    } else {
      if (dialogueType == "managePost") {
        const payload: any = {
          id: getDialogDataGet?.dialogueData?.userId,
        };

        dispatch(getUserProfile(payload));
      } else {
        const payload: any = {
          id: getDialogDataGet?.dialogueData?._id,
        };

        dispatch(getUserProfile(payload));
      }
    }
  }, [id, dialogueData]);

  useEffect(() => {
    setData(getUserProfileData);
  }, [getUserProfileData]);
  return (
    <>
      <div className="userSetting">
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle name={`User / ${multiButtonSelect}`} />
        </div>
        <div className="row">
          <div className="col-7">
            <div className="multi-user-btn mb-3 pb-2 multiButton">
              {labelData?.map((item: string, index: number) => {
                return (
                  <ToggleButtonGroup
                    key={index}
                    value={multiButtonSelect}
                    exclusive={true}
                    onChange={handleAlignment}
                    aria-label="text alignment"
                  >
                    <ToggleButton value={item} aria-label={item}>
                      <span className="text-capitalize">{item}</span>
                    </ToggleButton>
                  </ToggleButtonGroup>
                );
              })}
            </div>
          </div>
          <div className="col-5 d-flex justify-content-end">
            <Button
              btnName={"Back"}
              newClass={"back-btn"}
               btnIcon={<IconChevronCompactLeft/>}
              onClick={handleClose}
            />
          </div>
        </div>

        {multiButtonSelect === "Avatar" && (
          <AvatarSetting userProfileData={data} />
        )}
      </div>
    </>
  );
};

userProfile.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default userProfile;
