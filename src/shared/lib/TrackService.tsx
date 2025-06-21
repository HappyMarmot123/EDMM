"use client";

import useCloudinaryStore from "@/app/store/cloudinaryStore";
import { CloudinaryResourceMap } from "@/shared/types/dataType";

/* TODO: 
  전역상태 세팅은 Javascript XML 파일에서만 가능하므로
  서버사이드 데이터 조회(dataLoader)는 서비스 로직 레이어만 담당하고
  전역상태 및 클라이언트 사이드 로직은 이곳에서 진행 (네이밍은 Service 파일로 동일하게 진행)
*/

interface TrackServiceProps {
  tracks: CloudinaryResourceMap;
}

function TrackService({ tracks }: TrackServiceProps) {
  const setCloudinaryData = useCloudinaryStore(
    (state) => state.setCloudinaryData
  );
  setCloudinaryData(tracks);
  console.log("cloudinary Data setGlobalState", tracks.size);

  return null;
}

export default TrackService;
