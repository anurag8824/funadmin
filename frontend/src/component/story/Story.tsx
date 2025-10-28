import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import EditIcon from "../../assets/icons/EditBtn.svg";
import Pagination from "../../extra/Pagination";
import Button from "../../extra/Button";
import Table from "../../extra/Table";
import dayjs from "dayjs";
import { openDialog } from "../../store/dialogSlice";
import { warning } from "../../util/Alert";
import { deleteFakeVideo } from "../../store/videoSlice";
import { RootStore, useAppDispatch } from "../../store/store";
import Image from "next/image";
import { useRouter } from "next/router";
import { baseURL } from "@/util/config";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import VideoDialogue from "./StoryDialogue";
import FakeVideo from "./FakeStory";
import CreateFakeVideo from "./CreateFakeStory";
import { IconEdit, IconEye, IconTrash, IconVideo } from "@tabler/icons-react";
import { allStory, deleteFakeStory } from "@/store/storySlice";
import ReactAudioPlayer from "react-audio-player";
import NoImage from "../../assets/images/user.png";

interface VideoProps {
  startDate: string;
  endDate: string;
}

const Story: React.FC<VideoProps> = (props) => {
  const router = useRouter();
  const { realStory, totalRealStory } = useSelector(
    (state: RootStore) => state.story
  );
  const { dialogueType, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);
  const [selectCheckData, setSelectCheckData] = useState<any[]>([]);
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  useClearSessionStorageOnPopState("multiButton");
  const { startDate, endDate } = props;

  

  useEffect(() => {
    const payload: any = {
      includeFake: false,
      start: page,
      limit: size,
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(allStory(payload));
  }, [page, size, startDate, endDate]);

  useEffect(() => {
    setData(realStory);
  }, [realStory]);

  const handleSelectCheckData = (
    e: React.ChangeEvent<HTMLInputElement>,
    row: any
  ) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectCheckData((prevSelectedRows) => [...prevSelectedRows, row]);
    } else {
      setSelectCheckData((prevSelectedRows) =>
        prevSelectedRows.filter((selectedRow) => selectedRow._id !== row._id)
      );
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAllChecked(checked);
    if (checked) {
      setSelectCheckData([...data]);
    } else {
      setSelectCheckData([]);
    }
  };

  const handleEdit = (row: any) => {
    router.push({
      pathname: "/viewProfile",
      query: { id: row?.user?._id, type: "ViewFakeUser", includeFake: false }, // Include fake stories in the query
    });

    localStorage.setItem("postData", JSON.stringify(row));
  };

  const videoTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },

    // {
    //   Header: "Image",
    //   body: "videoImage",
    //   Cell: ({ row }: { row: any }) => (
    //     <img
    //       src={ row?.videoImage}
    //       width="50px"
    //       height="50px"
    //       alt="Video Image"
    //     />
    //   ),
    // },
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
            onClick={() => handleEdit(row)}
          >
            <img
              src={row?.user?.image}
              onError={(e) => {
                e.currentTarget.src = NoImage.src;
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
    //  {
    //       Header: "Song",
    //       body: "songLink",
    //       Cell: ({ row }: { row: any }) => (
    //         <ReactAudioPlayer
    //           src={ row?.backgroundSong?.songLink}
    //           controls
    //           muted
    //           onPlay={() => console.log("Audio is playing")}
    //           onError={(error) => console.error("Audio error:", error)}
    //         />
    //       ),
    //     },
    //      {
    //       Header: "Song Title",
    //       body: "songTitle",
    //       Cell: ({ row }: { row: any }) => (
    //         <span className="text-capitalize d-flex justify-content-start pl-5">{row?.backgroundSong?.songTitle || "-"}</span>
    //       ),
    //     },
    {
      Header: "Created date",
      body: "createdAt",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.createdAt ? dayjs(row?.createdAt).format("DD MMMM YYYY") : ""}
        </span>
      ),
    },
    // {
    //   Header: "Video",
    //   body: "video",
    //   Cell: ({ row }: { row: any }) => (
    //     <>
    //       <button
    //         className="viewbutton mx-auto"
    //         onClick={() =>
    //           dispatch(openDialog({ type: "viewVideo", data: row }))
    //         }
    //       >
    //        <IconVideo/>
    //       </button>
    //     </>
    //   ),
    // },
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
        </div>
      ),
    },
  ];

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value: number) => {
    setPage(1);
    setSize(value);
  };

  const handleDeleteVideo = (row: any) => {
    
    const data = warning();
    data
      .then((logouts: any) => {
        const yes = logouts;
        if (yes) {
          console.log("{id : row?._id , userId: row?.userId}-->", {
            id: row?._id,
            userId: row?.userId,
          });
          dispatch(deleteFakeStory({ id: row?._id, userId: row?.userId }));
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <div className="user-table mb-3">
        {dialogueType == "viewStory" && <VideoDialogue />}
        {dialogueType == "fakeStory" && <CreateFakeVideo />}

        <div className="user-table-top">
          <div className="row align-items-start">
            <div className="col-6">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Story
              </h5>
            </div>
          </div>
        </div>

        <Table
          data={data}
          mapData={videoTable}
          serverPerPage={size}
          serverPage={page}
          handleSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          type={"server"}
        />
        <div className="mt-3">
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={size}
            userTotal={totalRealStory}
            setPage={setPage}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Story;
