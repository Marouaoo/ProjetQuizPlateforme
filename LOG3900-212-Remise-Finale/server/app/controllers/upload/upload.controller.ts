import { Controller, Post, UploadedFile, UseInterceptors, Res, HttpStatus, Get, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: path.join(__dirname, '..', '..', '..', 'uploads'), // 📂 à la racine de ton projet (ou absolute selon ton projet)
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + extname(file.originalname));
                },
            }),
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        if (!file) {
            return res.status(HttpStatus.BAD_REQUEST).send('Aucun fichier reçu');
        }

        return res.status(HttpStatus.CREATED).json({ fileUrl: file.filename });
    }

    @Delete(':filename')
    async deleteFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = path.join(__dirname, '..', '..', '..', '..', '..', 'uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(HttpStatus.NOT_FOUND).send('Fichier non trouvé');
        }

        try {
            fs.unlinkSync(filePath);
            return res.status(HttpStatus.OK).send('Fichier supprimé');
        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erreur lors de la suppression du fichier');
        }
    }
}
