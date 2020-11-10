import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import { Observable } from 'rxjs';
import { CourseService } from 'src/app/services/course.service';
import { Router } from '@angular/router';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Course } from 'src/app/models/course.model';
import { ActivatedRoute } from '@angular/router';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';

@Component({
  selector: 'app-course-preview',
  templateUrl: './course-preview.component.html',
  styleUrls: ['./course-preview.component.css'],
})
export class CoursePreviewComponent implements OnInit {
  course: Course;
  reviews: Course['reviews'];
  valid: boolean;
  alreadyEnrolled: boolean = false;
  error: string;
  user: User;
  openedUpdateCourse: boolean;
  openedRateCourse: boolean;
  openedAllReviews: false;
  description: string = '';
  level: string = '';
  img: NgxFileDropEntry[] = [];
  imageError: string = '';
  loading: boolean = true;
  tags: string[] = [];
  errorMessage: string = '';

  courseReview: string = '';
  score: number = 0;
  anon: boolean = false;

  courseStars: number[] = [1, 2, 3, 4, 5];

  averageScore: number = 0;

  @ViewChild('reviewStars') stars;

  constructor(
    private userService: UserService,
    private activatedRouter: ActivatedRoute,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.userService.getCurrentUser();
    const id = this.activatedRouter.snapshot.params['id'];
    this.courseService.getCourse(id).subscribe(
      (incomingCourse: Course) => {
        this.valid = true;
        this.course = incomingCourse;
        this.reviews = this.course.reviews;
        this.description = this.course.description;
        this.level = this.course.level;
        this.tags = this.course.tags.split(' ');
        this.course.img =
          !this.course.img || this.course.img === ''
            ? (this.course.img = '../../../../assets/courseimage.png')
            // TODO: REMOVE LOCALHOST FROM PROD BUILD AFTER
            : `http://localhost:5000/api/course/documents/${this.course.img}`;
        for (let i = 0; i < this.course.students.length; i++) {
          if (this.course.students[i] == this.user._id) {
            this.alreadyEnrolled = true;
            break;
          }
        }

        this.averageScore = 0;

        this.course.reviews.forEach((review: any) => {
          this.averageScore += review.score;
        });

        this.averageScore = this.averageScore / this.course.reviews.length;

        this.loading = false;
      },
      (err) => {
        this.loading = false;
        this.valid = false;
        this.error = err.message;
        console.log('error message' + this.error);
      }
    );
  }

  // user type was IL and wasn't enrolled in course, and now decided to enroll in course
  enrollHandler() {
    this.courseService
      .enrollInCourse(this.userService.getCurrentUser()._id, this.course._id)
      .subscribe(
        (res) => {
          this.userService
            .enrollInCourse(this.userService.getCurrentUser()._id, {
              _id: this.course._id,
              name: this.course.name,
            })
            .subscribe(
              (res) => {
                this.userService.setUser(res);
                this.router.navigate(['dashboard']);
              },
              (err) => console.log(err)
            );
        },
        (err) => console.log(err)
      );
  }

  goToInstructorProfile($event): void {
    this.router.navigate([`/user/${$event}`]);
  }

  updateCourseContentHandler() {
    this.openedUpdateCourse = true;
  }

  editDocumentsHandler() {}

  assessmentsHandler() {}

  studentAnalysisHandler() {}

  cancel() {
    this.openedUpdateCourse = false;
  }
  registerHandler() {
    const { description, level } = this;

    // call add image
    for (const droppedFile of this.img) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          const formData = new FormData();
          formData.append('document', file, droppedFile.relativePath);
          this.courseService
            .postCourseImage(formData, this.course._id)
            .subscribe(
              (res: Course) => {
                this.ngOnInit();
              },
              (err) => {
                console.log(err);
              }
            );
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }

    this.course = { ...this.course, description, level };

    this.openedUpdateCourse = false;

    this.courseService.updateCourse(this.course).subscribe(
      (res: Course) => {
        this.ngOnInit();
      },
      (err) => console.log(err)
    );
  }

  public droppedCourseImage(image: NgxFileDropEntry[]) {
    this.img = image;
    for (const droppedFile of image) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          if (
            !(
              file.name.endsWith('.png') ||
              file.name.endsWith('.jpg') ||
              file.name.endsWith('.JPG') ||
              file.name.endsWith('.JPEG') ||
              file.name.endsWith('.jpeg')
            )
          ) {
            this.img = [];
            this.imageError = 'Bad Course Image!';
          } else {
            this.imageError = '';
          }
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  // usage code from - https://www.npmjs.com/package/ngx-file-drop
  public fileOver(event) {
    console.log(event);
  }

  // usage code from - https://www.npmjs.com/package/ngx-file-drop
  public fileLeave(event) {
    console.log(event);
  }

  setScore(score: number): void {
    this.score = score;
    this.stars.nativeElement.childNodes.forEach(
      (star, i) => (star.className = i < this.score ? 'is-solid' : '')
    );
  }

  onSubmitReview() {
    if (!this.score) return (this.errorMessage = 'You cannot give a 0 score!');
    this.courseService
      .addAReview(
        this.user._id,
        this.course._id,
        this.courseReview.trim(),
        this.score,
        this.anon
      )
      .subscribe((course) => {
        this.openedRateCourse = false;
        this.ngOnInit();
      });
  }
}
