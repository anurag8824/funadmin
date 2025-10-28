"use-client";

import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { addGift, updateGift, allGiftCategory } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import {  projectName } from "@/util/config";

import { uploadFile } from "@/store/adminSlice";


const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
};

interface ErrorState {
  image: String;
  giftCategory: String;
  coin: String;
}
interface giftCategoryData {
  _id: string;
  name: string;
  image: string;
}
const CreateGift = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );


  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [coin, setCoin] = useState<string>("");
  const [categoryDataSelect, setCategoryDataSelect] =
    useState<giftCategoryData>();
  const [imagePath, setImagePath] = useState<any>(null);

  

  const [error, setError] = useState<ErrorState>({
    image: "",
    giftCategory: "",
    coin: "",
  });

  // useEffect(() => {
  //   const payload: any = {};
  //   dispatch(allGiftCategory(payload));
  // }, []);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?.giftData?._id);
      setName(dialogueData?.giftData?.name);
      setCoin(dialogueData?.giftData?.coin);
      setImagePath(dialogueData?.giftData.image);
    }
    setAddCategoryOpen(dialogue);
  }, [dialogue, dialogueData]);

     const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          setImage([e.target.files[0]]);
          setImagePath(URL.createObjectURL(e.target.files[0]));
        }
      };
  

  let folderStructure: string = `${projectName}/admin/giftImage`;
  const handleFileUpload = async (image: any) => {


    // // Get theuploaded file from the event
    const file = image[0];
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", file.name);
    formData.append("content", file);

    // Create a payload for your dispatch
    const payloadformData: any = {
      data: formData,
    };

    if (formData) {
      const response: any = await dispatch(
        uploadFile(payloadformData)
      ).unwrap();

      if (response?.data?.status) {
        
        if (response.data.url) {
          setImage(response.data.url);
          setImagePath(response.data.url);

          return response.data.url
        }
      }
    }
  };



  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  const handleSubmit = async() => {


    

    if (!coin || !imagePath) {
      let error = {} as ErrorState;
      if (!coin) error.coin = "Coin is required";
      if (!imagePath) error.image = "Image is required";
      return setError({ ...error });
    } else {
      let url;
      if(!dialogueData){

         url = await handleFileUpload(image)
      }else if (image){
         url = await handleFileUpload(image)

      }

      const payloadData: any = {
        coin,
        image : url,
        type: image?.type === "image/gif" ? 2 : 1,
      };

      if (mongoId) {
        const payload: any = {
          data: payloadData,
          giftId: mongoId,
        };
        dispatch(updateGift(payload));
      } else {
        const payload: any = {
          data: payloadData,
          giftCategoryId: categoryDataSelect?._id,
        };
        dispatch(addGift(payload));
      }

      dispatch(closeDialog());
    }
  };
  return (
    <div>
      <Modal
        open={addCategoryOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
         <Box sx={style} className="">
          <div className="model-header">
            <p className="m-0">
              {dialogueData ? "Edit Gift" : "Add Gift"}
            </p>
          </div>

          <div className="model-body">
          <form>
            <div className="row sound-add-box" style={{ overflowX: "hidden" }}>
              <div className="col-12 mt-2">
                <Input
                  label={"Coin"}
                  name={"coin"}
                  placeholder={"Enter Coin..."}
                  value={coin}
                  type={"number"}
                  errorMessage={error.coin && error.coin}
                  onChange={(e) => {
                    setCoin(e.target.value);
                    if (!e.target.value) {
                      setError({
                        ...error,
                        coin: "Coin Is Required",
                      });
                    } else {
                      setError({
                        ...error,
                        coin: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-12 mt-2">
                <Input
                  type={"file"}
                  label={"Gift Image (GIF) Image"}
                  accept={"image/png, image/jpeg,image/gif"}
                  errorMessage={error.image && error.image}
                  onChange={handleImage}
                />
                <p className="fw-medium m-0 text-danger" style={{fontSize : "small"}}>(Note: Accept .png, .jpg, .gif)</p>
              </div>
              <div className="col-12 d-flex justify-content-center">
                {imagePath && (
                  <img
                    src={imagePath}
                    className="mt-3 rounded float-left mb-2"
                    height="100px"
                    width="100px"
                  //   onError={(e) => {
                  //   e.currentTarget.src = NoImage.src;
                  // }}
                  />
                )}
              </div>
              
            </div>
          </form>

          </div>

          <div className="model-footer">
                <div className="p-3 d-flex justify-content-end">
                <Button
                  onClick={handleCloseAddCategory}
                  btnName={"Close"}
                  newClass={"close-model-btn"}
                />
                <Button
                  onClick={handleSubmit}
                  btnName={dialogueData ? "Update" : "Submit"}
                  type={"button"}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "88px",
                    marginLeft: "10px",
                  }}
                />
              </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default CreateGift;
