"use-client";
import RootLayout from "../component/layout/Layout";
import React from "react";
import { RootStore, useAppSelector } from "../store/store";
import GiftShow from "@/component/gift/GiftShow";
import CreateGift from "@/component/gift/CreateGift";
import AddSvgaDialogue from "@/component/gift/AddSvgaDialogue";



const GiftPage = () => {
  const {  dialogueType } = useAppSelector(
    (state: RootStore) => state.dialogue
  );

  return (
    <>
      <div className="userPage">
        <div
          style={{
            display: `${
              dialogueType === "hostSettleMent"
                ? "none"
                : dialogueType === "hostHistory"
                ? "none"
                : dialogueType === "fakeUserAdd"
                ? "none"
                : dialogueType === "fakeUser"
                ? "none"
                : dialogueType === "hostReport"
                ? "none"
                : "block"
            }`,
          }}
        >
          <GiftShow />
          {dialogueType === "svgaGift" && <AddSvgaDialogue />}
          {dialogueType === "imageGift" && <CreateGift />}
        </div>
      </div>
    </>
  );
};

GiftPage.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default GiftPage;
