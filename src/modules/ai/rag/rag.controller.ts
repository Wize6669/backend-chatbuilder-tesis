import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion/ingestion.service';
import { QdrantService } from './qdrant.service';

@Controller('api/v1/rag')
export class RagController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly qdrant: QdrantService,
  ) {}

  @Post('ingest/:botConfigId')
  @UseInterceptors(FileInterceptor('file'))
  async ingestFile(
    @Param('botConfigId') botConfigId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const mime = file.mimetype;

    if (
      mime !== 'application/pdf' &&
      mime !== 'text/markdown' &&
      mime !== 'text/plain'
    ) {
      throw new BadRequestException('Solo se permiten PDF o Markdown');
    }

    await this.ingestionService.ingestFile({
      botConfigId,
      buffer: file.buffer,
      mimeType: mime,
      filename: file.originalname,
    });

    return {
      status: 'ok',
      message: `Documento ${file.originalname} procesado y embebido correctamente`,
    };
  }

  @Get('stats/:botConfigId')
  async getStats(@Param('botConfigId') botConfigId: string) {
    return this.ingestionService.getStats(botConfigId);
  }

  @Get('documents/:botConfigId')
  async listSources(@Param('botConfigId') botConfigId: string) {
    return this.qdrant.listSources(botConfigId);
  }

  @Delete('documents/:botConfigId')
  async deleteAll(@Param('botConfigId') botConfigId: string) {
    await this.ingestionService.deleteAllDocuments(botConfigId);

    return {
      status: 'ok',
      message: `Todos los documentos del bot ${botConfigId} fueron eliminados`,
    };
  }

  @Delete('documents/:botConfigId/source/:source')
  async deleteBySource(
    @Param('botConfigId') botConfigId: string,
    @Param('source') source: string,
  ) {
    await this.ingestionService.deleteBySource(botConfigId, source);

    return {
      status: 'ok',
      message: `Documento "${source}" eliminado del bot ${botConfigId}`,
    };
  }
}
