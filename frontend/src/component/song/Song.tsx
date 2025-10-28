import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import TrashIcon from "../../assets/icons/trashIcon.svg";
import EditIcon from "../../assets/icons/EditBtn.svg";
import AddIcon from "@mui/icons-material/Add";
import { useSelector } from "react-redux";
import { openDialog } from "../../store/dialogSlice";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";
import { warning } from "../../util/Alert";
import { deleteSong, allSong } from "../../store/songSlice";
import ReactAudioPlayer from "react-audio-player";
import { RootStore, useAppDispatch } from "@/store/store";
import Image from "next/image";
import { baseURL } from "@/util/config";
import useClearSessionStorageOnPopState from "@/extra/ClearStorage";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import NoImage from "../../assets/images/noImage.png"

interface SongCategory {
  _id: string;
  songImage: string;
  singerName: string;
  songCategoryId: {
    name: string;
  };
  songLink: string;
  songTitle: string;
}

const Song = ({ startDate, endDate }) => {
  const { allSongData, totalSong } = useSelector(
    (state: RootStore) => state.song
  );

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(10);
  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);
  useClearSessionStorageOnPopState("multiButton");

  

  useEffect(() => {
    let payload: any = {
      start: page,
      limit: size,
      startDate: startDate,
      endDate: endDate,
    };
    dispatch(allSong(payload));
  }, [page, size, startDate, endDate]);

  useEffect(() => {
    setData(allSongData);
  }, [allSongData]);

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const handleRowsPerPage = (value: number) => {
    setPage(1);
    setSize(value);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectAllChecked(checked);
  };

  const handleDeleteCategory = (row: SongCategory) => {

    const data = warning();
    data
      .then((logouts) => {
        if (logouts) {
          const payload: any = {
            songId: row?._id,
          };
          dispatch(deleteSong(payload));
        }
      })
      .catch((err) => console.log(err));
  };

  const songTable = [
    {
      Header: "NO",
      body: "no",
      Cell: ({ index }: { index: number }) => (
        <span className="  text-nowrap">{(page - 1) * size + index + 1}</span>
      ),
    },
    {
      Header: "Image",
      body: "songImage",
      Cell: ({ row, index }: { row: SongCategory; index: number }) => (
        <img
          src={ row?.songImage}
          width="40px"
          height="40px"
          alt={`Song ${index + 1}`}
           onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }}
        />
      ),
    },
    {
      Header: "Singer Name",
      body: "singerName",
      Cell: ({ row }: { row: SongCategory }) => (
        <span className="text-capitalize">{row?.singerName}</span>
      ),
    },
    {
      Header: "Song Category",
      body: "songCategory",
      Cell: ({ row }: { row: SongCategory }) => (
        <span className="text-capitalize">{row?.songCategoryId?.name}</span>
      ),
    },
    {
      Header: "Song",
      body: "songLink",
      Cell: ({ row }: { row: SongCategory }) => (
        <ReactAudioPlayer
          src={ row?.songLink}
          controls
          muted
          onPlay={() => console.log("Audio is playing")}
          onError={(error) => console.error("Audio error:", error)}
        />
      ),
    },
    {
      Header: "Song Title",
      body: "songTitle",
      Cell: ({ row }: { row: SongCategory }) => (
        <span className="text-capitalize d-flex justify-content-start pl-5">{row?.songTitle}</span>
      ),
    },
    {
      Header: "Action",
      body: "action",
      Cell: ({ row }: { row: SongCategory }) => (
        <div className="action-button">
          <Button
            btnIcon={
              <IconEdit className="text-secondary" />
            }
            onClick={() => {
              dispatch(openDialog({ type: "createSong", data: row }));
            }}
          />
          <Button
            btnIcon={
             <IconTrash  className="text-secondary" />
            }
            onClick={() => handleDeleteCategory(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="user-table">
        <div className="user-table-top">
            <div className="w-100">
              <h5
                style={{
                fontWeight: "500",
                fontSize: "18px",
                marginBottom: "5px",
                marginTop: "5px",
                markerStart: "10px",
                }}
              >
                Song 
              </h5>
            </div>
            <div
              className="col-6 new-fake-btn d-flex justify-content-end"
            >
              <Button
                btnIcon={<AddIcon />}
                btnName={"New"}
                onClick={() => {
                  dispatch(openDialog({ type: "createSong" }));
                }}
              />
            </div>

        </div>
        <Table
          data={data}
          mapData={songTable}
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
            userTotal={totalSong}
            setPage={setPage}
            handleRowsPerPage={handleRowsPerPage}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Song;
