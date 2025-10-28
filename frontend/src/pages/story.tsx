import React, { useState } from "react";
import NewTitle from "../extra/Title";
import Video from "../component/video/Video";
import FakeVideo from "../component/video/FakeVideo";
import CreateFakeVideo from "../component/video/CreateFakeVideo";
import { useSelector } from "react-redux";
import { RootStore } from "../store/store";
import RootLayout from "@/component/layout/Layout";
import Story from "@/component/story/Story";
import FakeStory from "@/component/story/FakeStory";
import StoryDialogue from "@/component/story/StoryDialogue";

const ManageVideo = (props) => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const [dayAnalytics, setDayAnalytics] = useState<string>("today");
  const [multiButtonSelect, setMultiButtonSelect] =
    useState<string>("Real Video");
  const [startDate, setStartDate] = useState<string>("All");
  const [endDate, setEndDate] = useState<string>("All");

  return (
    <div className="userPage channelPage">
      {/* {dialogueType === "fakeVideo" && <CreateFakeVideo />} */}
      {dialogueType == "viewStory" && <StoryDialogue />}
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
            <NewTitle
              dayAnalyticsShow={true}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              startDate={startDate}
              endDate={endDate}
              titleShow={false}
              setMultiButtonSelect={setMultiButtonSelect}
              multiButtonSelect={multiButtonSelect}
              name={`User`}
              labelData={["Real Story", "Fake Story"]}
            />
          </div>
      </div>
      {multiButtonSelect === "Real Story" && (
        // <></>
        <Story startDate={startDate} endDate={endDate} />
      )}
    {multiButtonSelect === "Fake Story" && (
        // <></>
        <FakeStory startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
};

ManageVideo.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default ManageVideo;
