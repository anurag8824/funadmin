import React, { useState } from "react";
import NewTitle from "../extra/Title";
import { RootStore } from "../store/store";
import CreateFakePost from "../component/post/CreateFakePost";
import { useSelector } from "react-redux";
import RootLayout from "@/component/layout/Layout";
import AcceptedVerificationRequest from "@/component/verificationRequest/AcceptedVerificationRequest";
import DeclineVerificationRequest from "@/component/verificationRequest/DeclineVerificationRequest";
import PendingVerificationRequest from "@/component/verificationRequest/PendingVerificationRequest";

interface ManagePostProps {}

const VerificationRequestTable = (props) => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const [multiButtonSelect, setMultiButtonSelect] =
    useState<string>("User Report");

  return (
    <div className="userPage channelPage">
      {dialogueType === "fakePost" && <CreateFakePost />}
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={false}
            name={`Report`}
            titleShow={false}
            multiButtonSelect={multiButtonSelect}
            setMultiButtonSelect={setMultiButtonSelect}
            labelData={["Pending", "Accepted", "Decline "]}
          />
        </div>
      </div>
      {multiButtonSelect === "Pending" && <PendingVerificationRequest />}

      {multiButtonSelect === "Decline " && <DeclineVerificationRequest />}

      {multiButtonSelect === "Accepted" && <AcceptedVerificationRequest />}
    </div>
  );
};
VerificationRequestTable.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default VerificationRequestTable;
