import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import EditIcon from "../../assets/icons/EditBtn.svg";
import Pagination from "../../extra/Pagination";
import Button from "../../extra/Button";
import Table from "../../extra/Table";
import dayjs from "dayjs";
import { RootStore, useAppDispatch } from "../../store/store";
import { openDialog } from "../../store/dialogSlice";
import AddIcon from "@mui/icons-material/Add";
import { warning } from "../../util/Alert";
import { allVideo, deleteFakeVideo } from "../../store/videoSlice";
import Image from "next/image";
import { useRouter } from "next/router";
import { baseURL } from "@/util/config";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import VideoDialogue from "./VideoDialogue";
import { IconEdit, IconTrash, IconVideo } from "@tabler/icons-react";
import NoImage from "../../assets/images/noImage.png";
import NoImageUser from "../../assets/images/user.png";


interface FakeVideoProps {
  startDate: string;
  endDate: string;
}

const FakeVideo: React.FC<FakeVideoProps> = (props) => {
  const router = useRouter();
  const { fakeVideoData, totalFakeVideo } = useSelector(
    (state: RootStore) => state.video
  );
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

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
      type: "fakeVideo",
      start: page,
      limit: size,
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(allVideo(payload));
  }, [page, size, startDate, endDate]);

  useEffect(() => {
    setData(fakeVideoData);
  }, [fakeVideoData]);

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
      query: { id: row?.userId ,type: "ViewFakeUser"  },
    });

    localStorage.setItem("postData", JSON.stringify(row));
    localStorage.removeItem("multiButton");
  };

  const videoTable = [
    {
      Header: "NO",
      body: "name",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },
    
    {
      Header: "Image",
      body: "videoImage",
      Cell: ({ row }: { row: any }) => (
        <img
          src={
             row?.videoImage
          }
          width="50px"
          height="50px"
          alt="Video Image"
            onError={(e) => {
                            e.currentTarget.src = NoImage.src;
                          }}
        />
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
          onClick={() => handleEdit(row)}
          >
            <img
              src={
                row?.userImage
              }
              width="50px"
              height="50px"
              style={{ marginRight: "10px" }}
               onError={(e) => {
                  e.currentTarget.src = NoImageUser.src;
                }}
            />
            <span
              className="text-capitalize userText "
              style={{
                cursor: "pointer",
              }}

            >
              {row?.name || row?.userId?.name}
            </span>
          </div>
        </>
      ),
    },

    {
      Header: "Likes",
      body: "totalLikes",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.totalLikes ? row?.totalLikes : 0}
        </span>
      ),
    },

    {
      Header: "Comments",
      body: "totalLikes",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">
          {row?.totalComments ? row?.totalComments : 0}
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
      Header: "Video",
      body: "video",
      Cell: ({ row }: { row: any }) => (
        <>
          <button
            className="viewbutton mx-auto"
            onClick={() =>
              dispatch(openDialog({ type: "viewVideo", data: row }))
            }
          >
           <IconVideo/>
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
            btnIcon={
             <IconEdit className="text-secondary" />
            }
            onClick={() => {
              dispatch(openDialog({ type: "fakeVideo", data: row }));
            }}
          />
          <Button
            btnIcon={
               <IconTrash  className="text-secondary" />
            }
            onClick={() => handleDeleteVideo(row)}
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
          dispatch(deleteFakeVideo(row?._id));
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <div className="user-table mb-3">
        {dialogueType == "viewVideo" && <VideoDialogue />}

        <div className="user-table-top">
          <div className="row align-items-start w-100">
            <div className="col-6">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Fake Video
              </h5>
            </div>
            <div className="col-6 d-flex justify-content-end">
              <div className="ms-auto ">
                <div className="new-fake-btn d-flex ">
                  <Button
                    btnIcon={<AddIcon />}
                    btnName={"New"}
                    onClick={() => {
                      dispatch(openDialog({ type: "fakeVideo" }));
                    }}
                  />
                </div>
              </div>
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
            userTotal={totalFakeVideo}
            setPage={setPage}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FakeVideo;
