import Button from "@/extra/Button";
import {
  getSetting,
  updateProfileManagement,
  uploadProfileImage,
} from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";

import { projectName } from "@/util/config";
import {
  IconEdit,
  IconEditCircleOff,
  IconEye,
  IconPhotoPlus,
  IconTrash,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import noImage from "../../assets/images/hashtagbanner.png";

const UpdateProfilePictureCollection = () => {
  const dispatch = useAppDispatch();
  const { settingData } = useSelector((state: RootStore) => state.setting);
  

  const [profileCollection, setProfileCollection] = useState([]);
  const [deleteIndex, setDeleteIndex] = useState([]);
  const [profileFile, setProfileFile] = useState([]);
  const [settingsId, setsettingsId] = useState("");

  useEffect(() => {
    const payload: any = {};
     dispatch(getSetting(payload));
  }, []);

  useEffect(() => {
    setProfileCollection(settingData?.profilePictureCollection || []);
    setsettingsId(settingData?._id);
  }, [settingData]);

  const handleImage = (e) => {
    const files = e.target.files;
    setProfileFile([...profileFile, ...files]);
  };

  const handleSubmit = async () => {
    
    let payload: any = {
      settingId: settingsId,
    };
    if (profileFile.length) {
      let folderSoundStructure: string = `${projectName}/defaultphoto`;
      const formData = new FormData();
      formData.append("folderStructure", folderSoundStructure);
      formData.append("keyName", Date.now().toString());
      profileFile.map((item) => {
        formData.append("content", item);
      });

      const response = await axios.put(
        `/admin/file/uploadBulkMedia`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response?.data?.status) {
        if (response?.data.urls) {
          const urls = response?.data.urls;
          console.log("urls-->", urls);
          payload.action = "add";
          payload.imageUrls = urls.toString();
        }
      }
    }
    dispatch(updateProfileManagement(payload));
    setProfileFile([])
  };

  const handleDelete = async (index, file) => {
    if (!(file instanceof File)) {
      
      const payload = {
        settingId: settingsId,
        action: "remove",
        indexes: index.toString(),
      };
      dispatch(updateProfileManagement(payload));
    } else {
      setProfileFile((prev) => prev.filter((item, i) => item !== file));
    }
  };

  return (
    <>
      <div className="payment-setting card1 p-0">
        <div className="cardHeader">
          <div className=" align-items-center d-flex flex-wrap justify-content-between p-3">
            <div>
              <p className="m-0 fs-5 fw-medium">Profile Management</p>
            </div>
            <Button
              btnName={"Submit"}
              type={"button"}
              onClick={handleSubmit}
              newClass={"submit-btn"}
              style={{
                borderRadius: "5px",
                width: "88px",
              }}
            />
          </div>
        </div>
        <div className="payment-setting-box p-3">
          {/* <div className="row">
            <div>
              <input
                type="file"
                className="form-control"
                onChange={handleImage}
                multiple
              />
            </div>
          </div> */}

          <div className="d-flex gap-2 mt-2 flex-wrap">
            <div className="avatar-img-user" style={{ cursor: "pointer" }}>
              <div className="profile-img">
                <label
                  htmlFor="image"
                  // onChange={(e: any) => handleImage(e)}
                  onChange={handleImage}
                >
                  <div className="align-items-center cursor-pointer d-flex h-100 justify-content-center position-absolute w-100">
                    <IconPhotoPlus className="text-secondary cursorPointer" />
                  </div>
                  <input
                    type="file"
                    name="image"
                    id="image"
                    style={{ display: "none" }}
                    multiple
                    accept=".png , .jpg, .jpeg"
                  />

                  {/* <img
                  src={noImage.src}
                  className="border"
                    style={{ width: 200, height: 200 , borderRadius : 170 }}
                    alt="Profile Avatar"
                    onError={(e) => {
                      e.currentTarget.src = noImage.src;
                    }}
                  /> */}
                  <div
                    className="border"
                    style={{ width: 200, height: 200, borderRadius: 170 }}
                  ></div>
                </label>
              </div>
            </div>
            {[...profileCollection, ...profileFile].map((item, index) => {
              return (
                <div className="">
                  <img
                    className=" border "
                    src={
                      item instanceof File ? URL.createObjectURL(item) : item
                    }
                    onError={(e) => {
                      e.currentTarget.src = noImage.src;
                    }}
                    alt=""
                    style={{ width: 200, height: 200, borderRadius: 170 }}
                  />

                  <div className="action-button mt-1">
                    <Button
                      btnIcon={<IconTrash className="text-danger" />}
                      onClick={() => {
                        handleDelete(index, item);
                        setProfileCollection((prev) => {
                          return prev.filter((_, i) => i !== index);
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateProfilePictureCollection;
