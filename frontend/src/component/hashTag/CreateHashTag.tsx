"use-client";

import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { addHashTag, updateHashTag } from "../../store/hashTagSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL, projectName } from "@/util/config";
import Image from "next/image";
import HashtagIcon from "@/assets/images/HashtagIcon.png";
import HashtagaBanner from "@/assets/images/hashtagbanner.png";

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
  hashTag: String;
  hashTagIcon: string;
}
const CreatehashTag = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<any>(null);
  const [hashTag, setHashTag] = useState<string>("");
  const [hashTagIcon, setHashTagIcon] = useState<any>(null);
  const [hashTagIconpath, setHashTagIconpath] = useState<any>(null);
  const [imagePath, setImagePath] = useState<any>(null);
  const [error, setError] = useState<ErrorState>({
    image: "",
    giftCategory: "",
    hashTag: "",
    hashTagIcon: "",
  });

  

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?._id);
      setHashTag(dialogueData?.hashTag);
      setImagePath(
        dialogueData?.hashTagBanner ? dialogueData?.hashTagBanner : null
      );
      setHashTagIconpath(
        dialogueData?.hashTagIcon ? dialogueData?.hashTagIcon : null
      );
    }
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  useEffect(() => {
    setAddCategoryOpen(dialogue);
  }, [dialogue]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
    }
  };

  let folderStructure: string = `${projectName}/admin/hashTagBanner`;

  const handleFileUpload = async (image: any) => {
    // // Get the uploaded file from the event
    const file = image[0];
    const extension = file.name.split(".").pop();
    const newFileName = `${Date.now()}.${extension}`;
    const renamedFile = new File([file], newFileName, {
      type: file.type,
      lastModified: file.lastModified, // optional, keeps original lastModified time
    });
    const formData = new FormData();

    formData.append("folderStructure", folderStructure);
    formData.append("keyName", renamedFile?.name);
    formData.append("content", renamedFile);

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

          return response.data.url;
        }
      }
    }
  };

  const handleUploadIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHashTagIcon([e.target.files[0]]);
      setHashTagIconpath(URL.createObjectURL(e.target.files[0]));
    }
  };

  let folderStructureIcon: string = `${projectName}/admin/hashTagIcon`;

  const handleFileUploadIcon = async (hashTagIcon: any) => {
    // // Get the uploaded file from the event
    const file = hashTagIcon[0];
    const extension = file.name.split(".").pop();
    const newFileName = `${Date.now()}.${extension}`;
    const renamedFile = new File([file], newFileName, {
      type: file.type,
      lastModified: file.lastModified, // optional, keeps original lastModified time
    });
    const formData = new FormData();

    formData.append("folderStructure", folderStructureIcon);
    formData.append("keyName", renamedFile?.name);
    formData.append("content", renamedFile);

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
          setHashTagIconpath(response.data.url);
          setHashTagIcon;
          response.data.url;

          return response.data.url;
        }
      }
    }
  };

  const handleSubmit = async () => {
    

    if (!hashTag || !imagePath || !hashTagIconpath) {
      let error = {} as ErrorState;
      if (!hashTag) {
        error.hashTag = "hashTag is required";
      }
      if (!imagePath) error.image = "Image is required";
      if (!hashTagIconpath) error.hashTagIcon = "Image is required";
      return setError({ ...error });
    } else {
      let hashTagBannerUrl;
      let handleTagIconUrl;
      if (!dialogueData) {
        hashTagBannerUrl = await handleFileUpload(image);
        handleTagIconUrl = await handleFileUploadIcon(hashTagIcon);
      } else {
        if (image && hashTagIcon) {
          hashTagBannerUrl = await handleFileUpload(image);
          handleTagIconUrl = await handleFileUploadIcon(hashTagIcon);
        }
        if (image) {
          hashTagBannerUrl = await handleFileUpload(image);
        } else if (hashTagIcon) {
          handleTagIconUrl = await handleFileUploadIcon(hashTagIcon);
        }
      }

      const paylaodData: any = {
        hashTag: hashTag,
        hashTagBanner: hashTagBannerUrl,
        hashTagIcon: handleTagIconUrl,
      };

      if (mongoId) {
        const payload: any = {
          data: paylaodData,
          hashTagId: mongoId,
        };
        dispatch(updateHashTag(payload));
      } else {
        const payload: any = {
          data: paylaodData,
        };
        dispatch(addHashTag(payload));
      }
    }

    dispatch(closeDialog());
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
              {dialogueData ? "Edit HashTag" : "Add HashTag"}
            </p>
          </div>

          <div className="model-body">
            <form>
              <div
                className="row sound-add-box"
                style={{ overflowX: "hidden" }}
              >
                <div className="col-12 mt-2">
                  <Input
                    label={"HashTag"}
                    name={"hashTag"}
                    placeholder={"Enter One HashTag..."}
                    value={hashTag}
                    type={"text"}
                    errorMessage={error.hashTag && error.hashTag}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHashTag(value);
                      if (!value) {
                        setError({
                          ...error,
                          hashTag: "HashTag Is Required",
                        });
                      } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                        setError({
                          ...error,
                          hashTag:
                            "HashTag can only contain letters, numbers, and underscores",
                        });
                      } else {
                        setError({
                          ...error,
                          hashTag: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-md-6 mt-3">
                  <Input
                    type={"file"}
                    label={"HashTag  Icon"}
                    accept={"image/png, image/jpeg,image/gif"}
                    errorMessage={error.image && error.image}
                    onChange={handleUploadIcon}
                  />
                  {hashTagIconpath && hashTagIconpath !== "" ? (
                    <img
                      src={hashTagIconpath}
                      className="mt-3 rounded float-left mb-2"
                      height={100}
                      width={100}
                      onError={(e) => {
                        const target: any = e.target as HTMLImageElement;
                        target.src = HashtagIcon.src;
                      }}
                      alt="HashTagIcon"
                    />
                  ) : (
                    <img
                      src={HashtagIcon.src}
                      className="mt-3 rounded float-left mb-2"
                      height={100}
                      width={100}
                      alt="HashTagIcon"
                    />
                  )}
                </div>

                <div className="col-12 col-md-6 mt-3">
                  <Input
                    type={"file"}
                    label={"HashTag Banner Image"}
                    accept={"image/png, image/jpeg,image/gif"}
                    errorMessage={error.image && error.image}
                    onChange={handleImage}
                  />
                  {imagePath && imagePath !== "" ? (
                    <img
                      src={imagePath}
                      className="mt-3 rounded float-left mb-2"
                      height={100}
                      width={100}
                      alt="HashTagBanner"
                    />
                  ) : (
                    <img
                      src={HashtagaBanner.src}
                      className="mt-3 rounded float-left mb-2"
                      height={100}
                      width={100}
                      alt="HashTagBanner"
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

export default CreatehashTag;
