
import { CoursePreviewComponent } from './pages/course-preview/course-preview.component';
import { EnrollCourseComponent } from './pages/enroll-course/enroll-course.component';
import { SignupQuestionaireComponent } from './pages/signup-questionaire/signup-questionaire.component';
import { CreateCourseComponent } from './pages/create-course/create-course.component';
import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginSignupComponent } from './pages/login-signup/login-signup.component';
import { CourseComponent } from './pages/course/course.component';
import { SignupQuestionaire2Component } from './pages/signup-questionaire2/signup-questionaire2.component';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
  { path: 'signup', component: LoginSignupComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'questionaire', component: SignupQuestionaireComponent},
  { path: 'questionaire2', component: SignupQuestionaire2Component},
  // changed path for course files
  { path: 'coursefile', component: CourseComponent },
  { path: 'createcourse', component: CreateCourseComponent },
  { path: 'enrollcourse', component: EnrollCourseComponent},
  { path: 'course/:id', component: CoursePreviewComponent},
  { path: 'profile', component: ProfileComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}