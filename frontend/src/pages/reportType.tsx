import React, { useState } from "react";
import NewTitle from "../extra/Title";
import { RootStore } from "../store/store";
import CreateFakePost from "../component/post/CreateFakePost";
import { useSelector } from "react-redux";
import RootLayout from "@/component/layout/Layout";
import UserReport from "@/component/report/UserReport";
import VideoReport from "@/component/report/VideoReport";
import PostReport from "@/component/report/PostReport";

interface ManagePostProps {}

const ManageReportType = (props) => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const [multiButtonSelect, setMultiButtonSelect] =
    useState<string>("User Report");
  const [startDate, setStartDate] = useState<string>("All");
  const [endDate, setEndDate] = useState<string>("All");

  return (
    <div className="userPage channelPage">
      {dialogueType === "fakePost" && <CreateFakePost />}
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={true}
            name={`Report`}
            titleShow={false}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            multiButtonSelect={multiButtonSelect}
            setMultiButtonSelect={setMultiButtonSelect}
            labelData={["User Report", "Post Report", "Video Report"]}
          />
        </div>
      </div>
      {multiButtonSelect === "User Report" && (
        <UserReport startDate={startDate} endDate={endDate} />
      )}

      {multiButtonSelect === "Video Report" && (
        <VideoReport startDate={startDate} endDate={endDate} />
      )}

      {multiButtonSelect === "Post Report" && (
        <PostReport startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
};
ManageReportType.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default ManageReportType;
