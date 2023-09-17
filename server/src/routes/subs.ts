import { NextFunction, Request, Response, Router } from "express";
import { User } from "../entities/User";
import userMiddleware from "../middlewares/user";
import authMiddleware from "../middlewares/auth";
import { isEmpty } from "class-validator";
import { AppDataSource } from "../data-source";
import Sub from "../entities/Sub";
import Post from "../entities/Post";
import multer, { FileFilterCallback } from "multer";
import { makeId } from "../utils/helpers";
import path from "path";
import { fstat, unlinkSync } from "fs";

const getSub = async (req: Request, res: Response) => {
    const name = req.params.name;
    try {
      const sub = await Sub.findOneByOrFail({ name });
  
      // 포스트를 생성한 후에 해당 sub에 속하는 포스트 정보들을 넣어주기
      const posts = await Post.find({
        where: { subName: sub.name },
        order: { createdAt: "DESC" },
        relations: ["comments", "votes"],
      });
  
      sub.posts = posts;
  
      if (res.locals.user) {
        sub.posts.forEach((p) => p.setUserVote(res.locals.user));
      }
  
      return res.json(sub);
    } catch (error) {
      return res.status(404).json({ error: "커뮤니티를 찾을 수 없습니다." });
    }
  };
  

const createSub = async(req:Request, res:Response, next)=> {
    const{name, title, description} = req.body;
    
    
    // 유저 정보가 있다면 sub 이름과 제목이 이미 있는 것인지 체크
    try {
        let errors:any ={};
        if(isEmpty(name)) errors.name = "이름은 비워둘 수 없습니다.";
        if(isEmpty(title)) errors.title = "제목은 비워둘 수 없습니다.";
        const sub = await AppDataSource
            .getRepository(Sub)
            .createQueryBuilder("sub")
            .where("lower(sub.name)= :name",{name:name.toLowerCase()})
            .getOne();

        if (sub) errors.name = "서브가 이미 존재합니다";

        if(Object.keys(errors).length > 0){
            throw errors;
        }
    } catch (error) {
        return res.status(400).json(error);
    }
    try {
        const user: User = res.locals.user;
        // Sub Instance 생성 후 데이터베이스에 저장
        const sub = new Sub();
        sub.name = name;
        sub.description = description;
        sub.title = title;
        sub.user = user;

        await sub.save();
        // 저장한 정보 프론트엔드로 전달해주기
        return res.json(sub);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error:"문제가 발생했습니다."});
    }
}
/*
const deleteSub = async(req:Request, res:Response, next)=> {
  const{name, title, description} = req.body;
  
  try {
      let errors: any = {};

      const body = req.params.subId;
      const usernameUser = await User.findOneBy({ name });
      const usertitle = await User.findOneBy({ title });
      const userdescription = await User.findOneBy({ description });
      const subToDelete = await AppDataSource.getRepository(Sub).findOneBy(body);


      const { email, username, password } = req.body;

      try {
          let errors: any = {};
      
          // 이메일과 유저이름이 이미 저장 사용되고 있는 것인지 확인.
          const emailUser = await User.findOneBy({ email });
          const usernameUser = await User.findOneBy({ username });
      
          // 이미 있다면 errors 객체에 넣어줌.
          if (emailUser) errors.email = "이미 해당 이메일 주소가 사용되었습니다.";
          if (usernameUser) errors.username = "이미 이 사용자 이름이 사용되었습니다.";
      
          // 에러가 있다면 return으로 에러를 response 보내줌.
          if (Object.keys(errors).length > 0) {
            return res.status(400).json(errors);
          }
      
          const user = new User();
          user.email = email;
          user.username = username;
          user.password = password;
      
          // 유저 정보를 user table에 저장.
          await user.save();
  
          //저장된 유저 정보를 response로 보내줌
          return res.json(user);

      if(!subToDelete){
        return res.status(404).json({error:"삭제할 서브를 찾을 수 없습니다."})
      }

      await subToDelete.remove();
      return res.json({message:"서브가 성공적으로 삭제되었습니다."})
  
    } catch (error) {
      return res.status(400).json(error);
  }
}
*/

const topSubs = async (req: Request, res: Response) => {
    try {
      const imageUrlExp = `COALESCE('${process.env.APP_URL}/images/' ||s."imageUrn",'https://www.gravatar.com/avatar?d=mp&f=y')`;
      const subs = await AppDataSource.createQueryBuilder()
        .select(
          `s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`
        )
        .from(Sub, "s")
        .leftJoin(Post, "p", `s.name = p."subName"`)
        .groupBy('s.title, s.name, "imageUrl"')
        .orderBy(`"postCount"`, "DESC")
        .limit(5)
        .execute();
      return res.json(subs);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "문제가 발생했습니다." });
    }
};


const ownSub = async (req: Request, res: Response, next: NextFunction) => {
  const user: User = res.locals.user;
  try {
    const sub = await Sub.findOneOrFail({ where: { name: req.params.name } });

    if (sub.username !== user.username) {
      return res
        .status(403)
        .json({ error: "이 커뮤니티를 소유하고 있지 않습니다." });
    }

    res.locals.sub = sub;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: " 문제가 발생했습니다." });
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: "public/images",
    filename: (_, file, callback) => {
      const name = makeId(15);
      callback(null, name + path.extname(file.originalname));
    },
  }),
  fileFilter: (_, file: any, callback: FileFilterCallback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      callback(null, true);
    } else {
      callback(new Error("이미지가 아닙니다."));
    }
  },
});

const uploadSubImage = async (req: Request, res: Response) => {
  const sub: Sub = res.locals.sub;
  try {
    const type = req.body.type;
    // 파일 유형을 지정치 않았을 시에는 업로든 된 파일 삭제
    if (type !== "image" && type !== "banner") {
      if (!req.file?.path) {
        return res.status(400).json({ error: "유효하지 않은 파일" });
      }

      // 파일을 지워주기
      unlinkSync(req.file.path);
      return res.status(400).json({ error: "잘못된 유형" });
    }

    let oldImageUrn: string = "";

    if (type === "image") {
      // 사용중인 Urn 을 저장합니다. (이전 파일을 아래서 삭제하기 위해서)
      oldImageUrn = sub.imageUrn || "";
      // 새로운 파일 이름을 Urn 으로 넣어줍니다.
      sub.imageUrn = req.file?.filename || "";
    } else if (type === "banner") {
      oldImageUrn = sub.bannerUrn || "";
      sub.bannerUrn = req.file?.filename || "";
    }
    await sub.save();

    // 사용하지 않는 이미지 파일 삭제
    if (oldImageUrn !== "") {
      const fullFilename = path.resolve(
        process.cwd(),
        "public",
        "images",
        oldImageUrn
      );
      unlinkSync(fullFilename);
    }

    return res.json(sub);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "문제가 발생했습니다." });
  }
};

const router = Router();

router.get("/:name", userMiddleware, getSub);
router.post("/", userMiddleware, authMiddleware, createSub);
router.get("/sub/topSubs", topSubs);
router.post(
  "/:name/upload",
  userMiddleware,
  authMiddleware,
  ownSub,
  upload.single("file"),
  uploadSubImage
);
export default router;