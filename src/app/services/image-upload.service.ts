import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private storage = getStorage();

  uploadImage(image: File, path: string): Observable<string> {
    return from(this.resizeImage(image, 120, 120)).pipe(
      switchMap((resizeImage) => {
        const storageRef = ref(this.storage, path);
        const uploadTask = from(uploadBytes(storageRef, resizeImage));
        return uploadTask.pipe(
          switchMap(() => from(getDownloadURL(storageRef))),
        );
      }),
    );
  }

  private resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          let offsetX = 0;
          let offsetY = 0;

          // ครอบภาพให้เป็นสี่เหลี่ยมจัตุรัส
          if (width > height) {
            offsetX = (width - height) / 2;
            width = height; // ครอบภาพให้เป็นสี่เหลี่ยมจัตุรัสโดยใช้ความสูง
          } else {
            offsetY = (height - width) / 2;
            height = width; // ครอบภาพให้เป็นสี่เหลี่ยมจัตุรัสโดยใช้ความกว้าง
          }

          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(
            img,
            offsetX,
            offsetY,
            width,
            height,
            0,
            0,
            maxWidth,
            maxHeight,
          );

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Canvas is empty'));
            }
          }, file.type);
        };
      };

      reader.readAsDataURL(file);
    });
  }
}
