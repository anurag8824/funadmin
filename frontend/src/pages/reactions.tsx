import RootLayout from "@/component/layout/Layout";
import ReactionDialogue from "@/component/reaction/ReactionDialogue";
import Button from "@/extra/Button";
import ToggleSwitch from "@/extra/ToggleSwitch";
import { openDialog } from "@/store/dialogSlice";
import {
  activeReaction,
  deleteReaction,
  getReaction,
} from "@/store/reactionSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { warning } from "@/util/Alert";
import AddIcon from "@mui/icons-material/Add";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import NoImage from '../assets/images/hashtagbanner.png';

interface BannerData {
  _id: string;
  image: string;
  isActive: false;
}

const Reaction = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const { reaction } = useSelector((state: RootStore) => state.reaction);

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<any>(1);
  const [size, setSize] = useState(20);

  

  useEffect(() => {
    dispatch(getReaction());
  }, [dispatch]);

  useEffect(() => {
    setData(reaction);
  }, [reaction]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleDeleteBanner = (row: any) => {
    
    const data = warning();
    data
      .then((res) => {
        if (res) {
          dispatch(deleteReaction(row?._id));
        }
      })
      .catch((err) => console.log(err));
  };

  const bannerTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span>{page * parseInt(index) + 1}</span>
      ),
    },
    {
      Header: "Reaction Image",
      Cell: ({ row, index }: { row: BannerData; index: number }) => (
        <div className="userProfile">
          <img
            src={row?.image}
            style={{ height: "75px", width: "150px", borderRadius: "8px" }}
            alt={`Reaction`}
          />
        </div>
      ),
    },

    {
      Header: "Active Status",
      body: "isActive",
      sorting: { type: "client" },
      Cell: ({ row }: { row: BannerData }) => (
        <ToggleSwitch
          value={row?.isActive}
          onClick={() => {
            

            const id: any = row?._id;
            dispatch(activeReaction(id));
          }}
        />
      ),
    },

    {
      Header: "Action",
      Cell: ({ row }: { row: BannerData }) => (
        <>
          <div className="action-button">
            <Button
              btnIcon={<IconEdit className="text-secondary" />}
              onClick={() => {
                dispatch(openDialog({ type: "editbanner", data: row }));
              }}
            />

            <Button
              btnIcon={<IconTrash className="text-secondary" />}
              onClick={() => handleDeleteBanner(row)}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "banner" && <ReactionDialogue />}
      {dialogueType === "editbanner" && <ReactionDialogue />}

      {/* <div className="userPage">
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
                Reactions
              </h5>
              <div className="betBox">
                <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn">
                  <Button
                    btnIcon={<AddIcon />}
                    btnName={"New"}
                    onClick={() => {
                      dispatch(openDialog({ type: "banner" }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Table
            data={data}
            mapData={bannerTable}
            PerPage={size}
            Page={page}
            type={"client"}
          />
          <Pagination
            type={"client"}
            activePage={page}
            rowsPerPage={size}
            userTotal={data?.length}
            setPage={setPage}
            setData={setData}
            data={data}
            actionShow={false}
          />
        </div>
      </div> */}

      <div className="giftCategoryShow userPage">
        <div className="align-content-center d-flex justify-content-between">
          <div className=" ">
            <h5
              style={{
                fontWeight: "500",
                fontSize: "18px",
                marginBottom: "5px",
                marginTop: "5px",
                markerStart: "10px",
              }}
            >
              Reactions
            </h5>
          </div>
          <div className="betBox">
            <div className="col-12 col-sm-6 col-md-6 col-lg-6 mt-2 m-sm-0 new-fake-btn">
              <Button
                btnIcon={<AddIcon />}
                btnName={"New"}
                onClick={() => {
                  dispatch(openDialog({ type: "banner" }));
                }}
              />
            </div>
          </div>
        </div>
        <div className="giftCategoryBox">
          <div className="row">
            {data?.length > 0 ? (
              data?.map((item: any, index: number) => {
                return (
                  <div className="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 col-xxl-3">
                    <div className="giftCategory">
                      <div className="giftCategory-img">
                        {item?.type === 3 ? (
                          <img
                            src={item?.svgaImage}
                            className="img-gift"
                            style={{
                              objectFit: "cover",
                              padding: "0px",
                            }}
                             onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }}
                          />
                        ) : (
                          <img src={item?.image} className="img-gift"  onError={(e)=>{
                e.currentTarget.src = NoImage.src; 
              }} />
                        )}

                        {/* <h5 style={{height : "20px" }}>
                            {item?.coin + " " + "Coin"}
                          </h5> */}
                          <ToggleSwitch
                          style={{position  : "relative" , top: "-117px" , left: "156px"}}
                            value={item?.isActive}
                            onClick={() => {
                              

                              const id: any = item?._id;
                              dispatch(activeReaction(id));
                            }}
                          />
                        <div className="action-button">
                          
                          <Button
                            btnIcon={<IconEdit className="text-secondary" />}
                            onClick={() => {
                              dispatch(
                                openDialog({ type: "editbanner", data: item })
                              );
                            }}
                          />
                          <Button
                            btnIcon={<IconTrash className="text-secondary" />}
                            onClick={() => handleDeleteBanner(item)}
                          />

                          
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "70vh" }}
              >
                <p className="mb-0">No Data Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
Reaction.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default Reaction;
