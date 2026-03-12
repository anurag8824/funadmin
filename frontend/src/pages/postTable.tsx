import React, { useState } from "react";
import NewTitle from "../extra/Title";
import Post from "../component/post/Post";
import FakePost from "../component/post/FakePost";
import { RootStore } from "../store/store";
import CreateFakePost from "../component/post/CreateFakePost";
import { useSelector } from "react-redux";
import RootLayout from "@/component/layout/Layout";
import PostDialogue from "@/component/post/PostDialogue";
import dayjs from "dayjs";

interface ManagePostProps {}

const ManagePost = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const [multiButtonSelect, setMultiButtonSelect] =
    useState<string>("Real Post");
 const [startDate, setStartDate] = useState<string | Date>("All"); 
const [endDate, setEndDate] = useState<string | Date>("All"); 


  return (
    <>
      <div className="userPage channelPage">
        {dialogueType === "fakePost" && <CreateFakePost />}
        {dialogueType === "postDetail" && <PostDialogue />}
        <div>
          <div className="dashboardHeader primeHeader mb-3 p-0">
            <NewTitle
              dayAnalyticsShow={true}
              setEndDate={setEndDate}
              setStartDate={setStartDate}
              startDate={startDate}
              endDate={endDate}
              name={`Sound`}
              titleShow={false}
              multiButtonSelect={multiButtonSelect}
              setMultiButtonSelect={setMultiButtonSelect}
              labelData={["Real Posts", "Fake Posts"]}
            />
          </div>
        </div>
        {multiButtonSelect === "Real Posts" && (
          <Post startDate={startDate} endDate={endDate}  />
        )}
        {multiButtonSelect === "Fake Posts" && (
          <FakePost startDate={startDate} endDate={endDate} />
        )}
      </div>
    </>
  );
};
ManagePost.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};

export default ManagePost;
