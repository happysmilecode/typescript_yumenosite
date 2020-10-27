import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import { Observable } from 'rxjs';
import { CourseService } from 'src/app/services/course.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/models/course.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-preview',
  templateUrl: './course-preview.component.html',
  styleUrls: ['./course-preview.component.css'],
})

export class CoursePreviewComponent implements OnInit {

  course = {
    _id: '',
    title: '',
    description: '',
    students: [],
    teachers: [],
    tags: '',
    level: '',
  };

  valid : boolean;
  alreadyEnrolled : boolean = false;
  error : string;
  user: User;

  constructor(
    private userService: UserService,
    private activatedRouter: ActivatedRoute,
    private courseService: CourseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.userService.getCurrentUser();
    const title = this.activatedRouter.snapshot.params['id'];
    this.courseService.getCourse(title).subscribe(
    (incomingCourse: Course) => {
      this.valid = true;
      this.course.title = incomingCourse[0].title;
      this.course.description = incomingCourse[0].description;
      this.course.students = incomingCourse[0].students;
      this.course.teachers = incomingCourse[0].teachers;
      this.course.tags = incomingCourse[0].tags;
      this.course.level = incomingCourse[0].level;
      this.course._id = incomingCourse[0]._id;

      for(let i=0;i<this.course.students.length ;i++){ 
        if(this.course.students[i] == this.user._id){
          this.alreadyEnrolled = true;
        }
     }
    },
    (err) => {
      this.valid = false;
      this.error = err.message;
      console.log("error message")
    }
    );
    
    //console.log(this.course);
  }

  enrollHandler() {
    // call another services to check if user already enrolled in course
    this.courseService
      .enrollInCourse(this.userService.getCurrentUser()._id, this.course._id)
      .subscribe(
        (res) => {
          console.log(res);
          this.userService
            .enrollInCourse(this.userService.getCurrentUser()._id, {
              _id: this.course._id,
              name: this.course.title,
            })
            .subscribe(
              (res) => console.log(res),
              (err) => console.log(err)
            );
        },
        (err) => console.log(err)
      );
    this.router.navigate(['dashboard']);
  }
}
