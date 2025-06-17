import { httpClient } from "@/shared/api/httpClient";
import type { CloudinaryResource } from "@/shared/types/dataType";

export default async function cloudinaryClient(): Promise<
  CloudinaryResource[]
> {
  try {
    const { data } = await httpClient.request<CloudinaryResource[]>({
      url: "/api/cloudinary",
      method: "GET",
    });

    if (!data) {
      throw new Error("Cloudinary fetch error");
    }

    return data;
  } catch (error) {
    console.error("Cloudinary fetch error:", error);
    return [];
  }
}
