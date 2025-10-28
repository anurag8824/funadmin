import RootLayout from "@/component/layout/Layout";
import React, { useEffect, useState } from "react";
import NewTitle from "../extra/Title";
import { useSelector } from "react-redux";
import { RootStore, useAppDispatch } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useRouter } from "next/router";
import { baseURL } from "@/util/config";
import Button from "@/extra/Button";
import Image from "next/image";
import TrashIcon from "../assets/icons/trashIcon.svg";
import { warning } from "@/util/Alert";
import { deleteFakePost, getUserPost } from "@/store/postSlice";
import PostDialogue from "@/component/post/PostDialogue";
import { closeDialog, openDialog } from "@/store/dialogSlice";
import VideoDialogue from "@/component/video/VideoDialogue";
import { deleteFakeVideo, getUserVideo } from "@/store/videoSlice";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import UserProfile from "@/component/user/UserProfile";
import { allUsers, getCountry, getUserProfile } from "@/store/userSlice";
import {
  IconBrowserShare,
  IconChevronCompactLeft,
  IconEye,
  IconPhotoScan,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { allStory, allUserStory, deleteFakeStory } from "@/store/storySlice";
import { start } from "repl";
import StoryDialogue from "@/component/story/StoryDialogue";
import dayjs from "dayjs";
import NoImageUser from "../assets/images/user.png";

export default function viewProfile(props) {
  useClearSessionStorageOnPopState("multiButton");

  const router = useRouter();

  const [multiButtonSelect, setMultiButtonSelect] = useState<string>("Profile");
  const { dialogueType, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const { getUserProfileData } = useSelector((state: RootStore) => state.user);

  const [imageShow, setImageShow] = useState<string>("");
  const { userPostData } = useSelector((state: RootStore) => state.post);
  const { userStoryData } = useSelector((state: RootStore) => state.story);

  const { userVideoData } = useSelector((state: RootStore) => state.video);

  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();

  const postData =
    typeof window !== "undefined" &&
    JSON.parse(localStorage.getItem("postData"));

  const userId = router?.query?.id;
  const includeFake = router?.query?.includeFake;

  useEffect(() => {
    setMultiButtonSelect("Profile");
  }, [userId]);

  const id =
    typeof window !== "undefined" &&
    JSON.parse(localStorage.getItem("postData"));

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getCountry());
    if (!router.isReady) return;
    const payload: any = {
      start: page,
      limit: size,
      id: userId,
    };
    dispatch(getUserPost(payload));
    dispatch(getUserVideo(userId));
  }, [router.isReady, dispatch]);

  useEffect(() => {
    if (!router.isReady) return;
    const payload: any = {
      start: page,
      limit: size,
      startDate: "all",
      endDate: "all",
      userId: userId,
      includeFake: includeFake,
    };
    dispatch(allUserStory(payload));
  }, [router.isReady, dispatch]);

  useEffect(() => {
    if (!router.isReady) return;
    const payload: any = {
      id: searchParams.get("id"),
    };
    dispatch(getUserProfile(payload));
  }, [router.isReady]);

  useEffect(() => {
    setImageShow(postData?.image || "");
  }, [postData]);

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value: number) => {
    setPage(1);
    setSize(value);
  };

  const handlePostDetails = async (row: any) => {
    dispatch(openDialog({ type: "viewPost", data: row }));
  };

  const handleVideoDetails = async (row: any) => {
    dispatch(openDialog({ type: "viewVideo", data: row }));
  };

  const handleDeletePost = (row: any) => {
    const data = warning();
    data
      .then((logouts: any) => {
        if (logouts) {
          dispatch(deleteFakePost(row?._id));
        }
      })
      .catch((err: any) => console.log(err));
  };

  

  const handleDeleteVideo = (row: any) => {
    
    const data = warning();
    data
      .then((logouts: any) => {
        if (logouts) {
          dispatch(deleteFakeVideo(row?._id));
        }
      })
      .catch((err: any) => console.log(err));
  };
  const handleDeleteStory = (row: any) => {
    
    const data = warning();
    data
      .then((logouts: any) => {
        if (logouts) {
          console.log("row?.user?-->", row?.user);
          dispatch(
            deleteFakeStory({ storyId: row?._id, userId: row?.user?._id })
          );
        }
      })
      .catch((err: any) => console.log(err));
  };

  const handleClose = () => {
    if (dialogueData) {
      dispatch(closeDialog());
    } else {
      router.back();
    }

    localStorage.setItem("multiButton", JSON.stringify("Fake User"));
  };

  const postTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },

    {
      Header: "Likes",
      body: "Likes",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.totalLikes}</span>
      ),
    },

    {
      Header: "Comments",
      body: "Comments",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.totalComments}</span>
      ),
    },

    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.createdAt ? row?.createdAt.split("T")[0] : ""}
        </span>
      ),
    },
    {
      Header: "Image",
      body: "soundImage",
      Cell: ({ row }: { row: any }) => (
        <>
          <button
            className="viewbutton mx-auto"
            onClick={() => handlePostDetails(row)}
          >
            <IconPhotoScan />

            {/* <span>View Post</span> */}
          </button>
        </>
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button">
          <Button
            btnIcon={<IconTrash className="text-secondary" />}
            onClick={() => handleDeletePost(row)}
          />
        </div>
      ),
    },
  ];

  const videoTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },

    {
      Header: "Likes",
      body: "Likes",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.totalLikes}</span>
      ),
    },

    {
      Header: "Comments",
      body: "Comments",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.totalComments}</span>
      ),
    },

    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.createdAt ? row?.createdAt.split("T")[0] : ""}
        </span>
      ),
    },
    {
      Header: "Video",
      body: "soundImage",
      Cell: ({ row }: { row: any }) => (
        <>
          <button
            className="viewbutton mx-auto"
            onClick={() => handleVideoDetails(row)}
          >
            <IconVideo />

            {/* <span>View Video</span> */}
          </button>
        </>
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button">
          <Button
            btnIcon={<IconTrash className="text-secondary" />}
            onClick={() => handleDeleteVideo(row)}
          />
        </div>
      ),
    },
  ];
  const storyTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },

    {
      Header: "User",
      body: "name",
      Cell: ({ row }: { row: any }) => (
        <>
          <div
            className="text-capitalize userText fw-bold d-flex align-items-center"
            style={{
              cursor: "pointer",
            }}
          >
            <img
              src={row?.user?.image}
              onError={(e) => {
                e.currentTarget.src = NoImageUser.src;
              }}
              width="50px"
              height="50px"
              style={{ marginRight: "10px" }}
            />
            <span
              className="text-capitalize userText "
              style={{
                cursor: "pointer",
              }}
            >
              {row?.user?.name}
            </span>
          </div>
        </>
      ),
    },

    {
      Header: "Story Type",
      body: "storyType",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.storyType == 1 ? "Image" : "Video"}
        </span>
      ),
    },
    {
      Header: "View Count",
      body: "viewsCount",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.viewsCount ? row?.viewsCount : 0}
        </span>
      ),
    },

    {
      Header: "Reaction Count",
      body: "totalLikes",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.reactionsCount ? row?.reactionsCount : 0}
        </span>
      ),
    },
    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button">
          <Button
            btnIcon={<IconEye className="text-secondary" />}
            onClick={() => {
              dispatch(openDialog({ type: "viewStory", data: row }));
            }}
          />
          <Button
            btnIcon={<IconTrash className="text-secondary" />}
            onClick={() => handleDeleteStory(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {dialogueType == "viewPost" && <PostDialogue />}
      {dialogueType == "viewVideo" && <VideoDialogue />}
      {dialogueType == "viewStory" && <StoryDialogue />}
      <div
        className="dashboardHeader primeHeader mb-3 p-0 row align-items-center"
        style={{ padding: "20px" }}
      >
        <div className="col-10" style={{ padding: "5px" }}>
          <NewTitle
            dayAnalyticsShow={false}
            name={`viewProfile`}
            titleShow={false}
            multiButtonSelect={multiButtonSelect}
            setMultiButtonSelect={setMultiButtonSelect}
            labelData={["Profile", "Post", "Video", "Story"]}
          />
        </div>

        <div
          className="col-2"
          style={{ marginTop: "20px", display: "flex", justifyContent: "end" }}
        >
          <Button
            btnName={"Back"}
            newClass={"back-btn"}
            btnIcon={<IconChevronCompactLeft />}
            onClick={handleClose}
          />
        </div>
        {multiButtonSelect !== "Profile" ? (
          <div className="userPage">
            <div className="user-table real-user mb-3">
              <div className="user-table-top">
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <h5
                    style={{
                      fontWeight: "500",
                      fontSize: "18px",
                      marginBottom: "5px",
                      marginTop: "5px",
                      markerStart: "10px",
                    }}
                  >
                    {multiButtonSelect}
                  </h5>
                </div>
              </div>
              {["Post", "Video"].includes(multiButtonSelect) && (
                <Table
                  data={
                    multiButtonSelect == "Post" ? userPostData : userVideoData
                  }
                  mapData={multiButtonSelect == "Post" ? postTable : videoTable}
                  serverPerPage={size}
                  serverPage={page}
                  type={"server"}
                />
              )}
              {["Story"].includes(multiButtonSelect) && (
                <Table
                  data={userStoryData?.length > 0 ? userStoryData : []}
                  mapData={storyTable}
                  serverPerPage={size}
                  serverPage={page}
                  type={"server"}
                />
              )}
            </div>
          </div>
        ) : (
          // <Table
          //   data={multiButtonSelect == "Post" ? userPostData : userVideoData}
          //   mapData={multiButtonSelect == "Post" ? postTable : videoTable}
          //   serverPerPage={size}
          //   serverPage={page}
          //   type={"server"}
          // />
          ""
        )}

        {multiButtonSelect === "Profile" && <UserProfile />}
      </div>
      <div className="mt-3">
        <Pagination
          type={"server"}
          activePage={page}
          rowsPerPage={size}
          // userTotal={totalRealPost}
          setPage={setPage}
          handleRowsPerPage={handleRowsPerPage}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

viewProfile.getLayout = function getLayout(page) {
  return <RootLayout>{page}</RootLayout>;
};
