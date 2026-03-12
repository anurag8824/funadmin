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
import { allPost, deleteFakePost } from "../../store/postSlice";
import AddIcon from "@mui/icons-material/Add";
import { warning } from "../../util/Alert";
import Image from "next/image";
import { baseURL } from "@/util/config";
import { useRouter } from "next/router";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import PostDialogue from "./PostDialogue";
import PostImageDialogue from "./PostImageDialogue";
import { IconEdit, IconPhotoHeart, IconTrash } from "@tabler/icons-react";
import NoImage from '../../assets/images/user.png'

interface FakePostProps {
  startDate: string |Date;
  endDate: string | Date;
}

const FakePost: React.FC<FakePostProps> = (props) => {
  const router = useRouter();
  const { fakePostData, totalFakePost } = useSelector(
    (state: RootStore) => state.post
  );


  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectCheckData, setSelectCheckData] = useState<any[]>([]);
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  useClearSessionStorageOnPopState("multiButton");

  

  useEffect(() => {
    const payload: any = {
      type: "fakePost",
      start: page,
      limit: size,
      startDate: props.startDate,
      endDate: props.endDate,
    };
    dispatch(allPost(payload));
  }, [page, size, props.startDate, props.endDate]);

  useEffect(() => {
    setData(fakePostData);
  }, [fakePostData]);


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
      query: { id: row?.userId ,type: "ViewFakeUser" },
    });

    let dialogueData_ = {
      dialogue: true,
      dialogueData: row,
    };
    localStorage.setItem("postData", JSON.stringify(row));
    localStorage.removeItem("multiButton");
  };

  const handleRedirect = (row: any) => {
    localStorage.setItem("allpostData", JSON.stringify(row));
    localStorage.removeItem("multiButton");

    router.push({
      pathname: "/viewPost",
    });
  };

  const postTable = [
    {
      Header: "NO",
      body: "NO",
      Cell: ({ index }: { index: number }) => (
        <span>{(page - 1) * size + index + 1}</span>
      ),
    },
  
    {
      Header: "User",
      body: "planBenefit",
      Cell: ({ row }: { row: any }) => (
        <div
          className="d-flex align-items-center"
          style={{
            cursor: "pointer",
            display: "flex",
            columnGap: "20px",
          }}
           
          onClick={() => handleEdit(row)}
        >
          <img src={row?.userImage} width="50px" height="50px"  onError={(e) => {
                  e.currentTarget.src = NoImage.src;
                }}/>
          <span className="text-capitalize">
            {row?.userId?.name ? row?.userId?.name : row?.name}
          </span>
        </div>
      ),
    },

    {
      Header: "Share count",
      body: "shareCount",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.shareCount}</span>
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
        Header: "Posts",
        body: "soundImage",
        Cell: ({ row }: { row: any }) => (
          <>
            <button
              className="viewbutton mx-auto pt-2 pb-2"
              onClick={() =>
                dispatch(openDialog({ type: "postImage", data: row }))
              }
            >
             <IconPhotoHeart/>
  
              {/* <span>View Post</span> */}
            </button>
          </>
        ),
      },
    // {
    //   Header: "View Post",
    //   body: "view",
    //   Cell: ({ row }) => (
    //     <>
    //       <button
    //         className="viewbutton mx-auto"
    //         onClick={() =>
    //           dispatch(openDialog({ type: "postImage", data: row }))
    //         }
    //       >
    //         <svg
    //           viewBox="0 0 24 24"
    //           width="24"
    //           height="24"
    //           stroke="currentColor"
    //           strokeWidth="2"
    //           fill="none"
    //           strokeLinecap="round"
    //           stroke-linejoin="round"
    //           className="css-i6dzq1"
    //         >
    //           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    //           <circle cx="12" cy="12" r="3"></circle>
    //         </svg>
    //         <span>View</span>
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
            btnIcon={
              <IconEdit className="text-secondary" />
            }
            onClick={() => {
              dispatch(openDialog({ type: "fakePost", data: row }));
            }}
          />
          <Button
            btnIcon={
              <IconTrash  className="text-secondary" />
            }
            onClick={() => handleDeletePost(row)}
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

  return (
    <div>
      <div className="user-table mb-3">
        {dialogueType == "viewPost" && <PostDialogue />}
        {dialogueType == "postImage" && <PostImageDialogue />}

        <div className="user-table-top">
          <div className="align-items-start d-flex justify-content-between w-100">
            <div className="col-6">
              <h5
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  marginTop: "5px",
                  marginBottom: "4px",
                }}
              >
                Fake Post
              </h5>
            </div>
            <div className="col-6 d-flex justify-content-end">
              <div className="ms-auto ">
                <div className="new-fake-btn d-flex ">
                  <Button
                    btnIcon={<AddIcon />}
                    btnName={"New"}
                    onClick={() => {
                      dispatch(openDialog({ type: "fakePost" }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Table
          data={data}
          mapData={postTable}
          serverPerPage={size}
          serverPage={page}
          handleSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          type={"server"}
        />
        <div className="">
          <Pagination
            type={"server"}
            activePage={page}
            rowsPerPage={size}
            userTotal={totalFakePost}
            setPage={setPage}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FakePost;
