import { IsNotEmpty, IsString } from 'class-validator';

export class ForceDeleteUserDto {
    @IsNotEmpty({ message: 'User pengganti harus diisi' })
    @IsString()
    replacementUserId: string;
}
