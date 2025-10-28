"use-client";

import React, { useEffect, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import html2canvas from "html2canvas";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import { addGift, updateGift, allGiftCategory } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL, projectName } from "@/util/config";
import { uploadFile } from "@/store/adminSlice";
import { uploadMultipleFiles } from "@/store/postSlice";

import NoImage from '../../assets/images/hashtagbanner.png'

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

const AddSvgaDialogue = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [isSubmit, setIsSubmit] = useState<boolean>(true);
  const [coin, setCoin] = useState<string>("");
  const [images, setImages] = useState<any>([]);
  const [imageData, setImageData] = useState<any>(null);
  const [imagePath, setImagePath] = useState<any>(null);
  const [isSvga, setIsSvga] = useState<any>(false);
  const [error, setError] = useState<ErrorState>({
    image: "",
    giftCategory: "",
    coin: "",
  });

  



  useEffect(() => {
    if (!dialogueData) {
      setIsSubmit(true);
      setIsSvga(false);
    }
  }, []);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?.giftData?._id);
      setName(dialogueData?.giftData?.name);
      setCoin(dialogueData?.giftData?.coin);
      setImagePath(dialogueData?.giftData.image);  // Ensure this is set
      if (dialogueData?.giftData?.image?.split(".")?.pop() === "svga") {
        setIsSvga(true);
      }
    }
    setAddCategoryOpen(dialogue);
  }, [dialogue, dialogueData]);


  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    dispatch(closeDialog());
    localStorage.setItem("dialogueData", JSON.stringify(dialogueData));
  };

  useEffect(() => {
    const loadSvgaPlayerWeb = async () => {
      const { Player, Parser } = await import("svgaplayerweb");
      if (isSvga) {
        const parser = new Parser();
        const element: any = document.getElementById("svga");

        if (element && (imagePath || imageData?.preview)) {
          const player = new Player(element);
          const svgaSource = imagePath; // Load preview first

          parser.load(svgaSource, (videoItem) => {
            player.setVideoItem(videoItem);
            player.startAnimation();
            setTimeout(() => {
              captureAndSendImage(player, mongoId);
            }, 3000);
          });
        }
      } else {
        setIsSubmit(false);
      }
    };

    if (typeof window !== "undefined") {
      setTimeout(() => {
        loadSvgaPlayerWeb();
      }, 300); // Small delay ensures the modal is rendered
    }
  }, [imageData, isSvga, imagePath, dialogueData]);





  const captureAndSendImage = (player: any, mongoId: any) => {
    return new Promise((resolve) => {
      player.pauseAnimation();
      const canvasElement = document.querySelector(
        `div[id="svga"] canvas`
      ) as HTMLElement;
      if (!canvasElement) {
        return;
      }
      html2canvas(canvasElement, {
        scale: 1,
        useCORS: true,
        backgroundColor: "rgba(0, 0, 0, 0)",
        onclone: (cloneDoc) => {
          const clonedCanvas = cloneDoc.querySelector(
            `div[id="svga"] canvas`
          ) as HTMLElement;
          if (clonedCanvas) {
            clonedCanvas.style.backgroundColor = "transparent";
          }
        },
      }).then((canvas) => {
        const data = canvas.toDataURL("image/png");
        canvas.toBlob((blob: any) => {
           if (!blob) return;
            const file = new File([blob], `svga-capture${Date.now()}.png`, {
      type: "image/png",
      lastModified: new Date().getTime(),
    });
          resolve(blob);
          setImage(file);
          setIsSubmit(false);
        }, "image/png");
      });
    });
  };

  const handleInputImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setImage(null);
    setIsSubmit(true);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setImageData(file);
      setImages([file]);

      const reader = new FileReader();

      reader.addEventListener("load", () => {
        if (reader.result) {
          setImagePath(reader.result.toString());
        }
        setError({
          ...error,
          image: "",
        });
      });

      reader.readAsDataURL(file);

      if (file.name.split(".").pop() === "svga") {
        setIsSvga(true);
      } else {
        setIsSvga(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setImage(null);
    setIsSubmit(true);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Object.assign(file, { preview: URL.createObjectURL(file) });
      setImageData(file);
      setImages([file]);

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (reader.result) {
          setImagePath(reader.result.toString());
        }
        setError({
          ...error,
          image: "",
        });
      });
      reader.readAsDataURL(file);

      setIsSvga(file.name.split(".").pop() === "svga");

      // Define folder structure
      console.log("image0--->" , image);
      console.log("file--->" , file);
      let folderStructure: string = `${projectName}/admin/giftImage`;
      const formData = new FormData();
      formData.append("folderStructure", folderStructure);
      formData.append("keyName", file.name);
      formData.append("content", file);
      formData.append("content", image)


      // Create a payload for your dispatch
      const payloadformData: any = {
        data: formData,
      };

      try {
        const response: any = await dispatch(uploadMultipleFiles(payloadformData)).unwrap();
        if (response?.data?.status && response.data.urls) {
          setImage(response.data.urls);
          setImagePath(response.data.urls);

          return response.data.urls
        }
      } catch (error) {
        console.error("File upload failed", error);
      }
    }
  };

  const handleSubmit = async () => {

    

    if (!coin || (!imagePath && !dialogueData)) {
      let error = {} as ErrorState;
      if (!coin) error.coin = "Coin is required";
      if ((!dialogueData  && !imagePath )) error.image = "Image is required";
      return setError({ ...error });
    }

    const url = await handleFileUpload({ target: { files: images } } as React.ChangeEvent<HTMLInputElement>);
    const formData = {
      coin,
      // svgaImage:  url?.[1] ,
      svgaImage: isSvga ? url?.[1] : url?.[0],
      image: url?.[0],
      type: 3
    }

    if (mongoId) {
      const payload: any = {
        data: formData,
        giftId: mongoId,
      };
      dispatch(updateGift(payload));
    } else {
      const payload: any = {
        data: formData,
      };
      dispatch(addGift(payload));
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
        {/* <Box sx={style} className="create-channel-model"> */}
          
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
                  label={"Gift Image"}
                  accept={".svga, .gift, .webp"}
                  errorMessage={!dialogueData ? error.image && error.image : ""}
                  onChange={handleInputImage}
                />
                <p className="fw-medium m-0 text-danger" style={{fontSize : "small"}}>(Note: Accept only .svga, .gif, .webp)</p>
              </div>
              <div className="col-12 d-flex justify-content-center">
                <div className="row">
                  {imagePath && (
                    <>
                      {!isSvga ? (
                        <img
                          src={imagePath}
                          className="mt-3 rounded float-left mb-2"
                          height="100px"
                          width="100px"
                          onError={(e) => {
                            e.currentTarget.src = NoImage.src;
                          }}
                        />
                      ) : (
                        <>
                          <div
                            id="svga"
                            style={{
                              boxShadow: "0 5px 15px 0 rgb(105 103 103 / 00%)",
                              float: "left",
                              objectFit: "contain",
                              marginRight: 15,
                              width: "350px",
                              marginBottom: "10px",
                              backgroundColor: "transparent",
                              height: "350px",
                            }}
                          ></div>
                        </>
                      )}
                    </>
                  )}
                </div>
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
                disabled={isSubmit === true ? true : false}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "88px",
                  marginLeft: "10px",
                  opacity: `${isSubmit === true ? "0.6" : "1"}`,
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default AddSvgaDialogue;
