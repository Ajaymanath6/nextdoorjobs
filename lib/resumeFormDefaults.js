export const EMPTY_WORK = {
  companyName: "",
  companyUrl: "",
  position: "",
  responsibilities: "",
  keyAchievements: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  employmentType: "",
  duties: "",
  year: "",
};

export const EMPTY_EDUCATION = {
  degree: "",
  specialization: "",
  universityName: "",
  streamName: "",
  marksOrScore: "",
  startYear: "",
  endYear: "",
  yearOfPassing: "",
};

export const EMPTY_SKILL = { name: "", isPrimary: false, proficiency: "Intermediate" };
export const EMPTY_CERT = { name: "", issuingOrg: "", year: "", certificateUrl: "" };
export const EMPTY_LANGUAGE = { language: "", proficiency: "Intermediate" };
export const EMPTY_OTHER_LINK = { label: "", url: "" };

export function getDefaultResumeForm(userEmail = "") {
  return {
    firstName: "",
    lastName: "",
    emailOverride: userEmail,
    currentPosition: "",
    professionalHeadline: "",
    aboutMe: "",
    yearsExperience: "",
    workExperiences: [{ ...EMPTY_WORK }],
    educations: [{ ...EMPTY_EDUCATION }],
    skills: [{ ...EMPTY_SKILL }],
    certifications: [],
    languages: [{ ...EMPTY_LANGUAGE }],
    linkedInUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    behanceUrl: "",
    dribbbleUrl: "",
    otherLinks: [],
    lookingFor: [],
    preferredJobRole: "",
    preferredIndustry: "",
    workMode: "",
    noticePeriod: "",
    noticePeriodCustom: "",
    expectedSalaryPackage: "",
    currentSalaryPackage: "",
    currentSalaryVisibleToRecruiter: false,
    salaryCurrency: "INR",
    salaryNegotiable: false,
    hourlyRate: "",
    dailyRate: "",
    projectRate: "",
  };
}

export function resumeToForm(r, userEmail = "") {
  const work =
    r.workExperiences?.length > 0
      ? r.workExperiences.map((w) => ({
          companyName: w.companyName ?? "",
          companyUrl: w.companyUrl ?? "",
          position: w.position ?? "",
          responsibilities: w.responsibilities ?? w.duties ?? "",
          keyAchievements: w.keyAchievements ?? "",
          startDate: w.startDate ?? "",
          endDate: w.endDate ?? "",
          isCurrent: w.isCurrent ?? false,
          employmentType: w.employmentType ?? "",
          duties: w.duties ?? w.responsibilities ?? "",
          year: w.year ?? "",
        }))
      : [{ ...EMPTY_WORK }];

  const edu =
    r.educations?.length > 0
      ? r.educations.map((e) => ({
          degree: e.degree ?? "",
          specialization: e.specialization ?? e.streamName ?? "",
          universityName: e.universityName ?? "",
          streamName: e.streamName ?? e.specialization ?? "",
          marksOrScore: e.marksOrScore ?? "",
          startYear: e.startYear ?? "",
          endYear: e.endYear ?? e.yearOfPassing ?? "",
          yearOfPassing: e.yearOfPassing ?? e.endYear ?? "",
        }))
      : [{ ...EMPTY_EDUCATION }];

  const skills =
    r.skills?.length > 0
      ? r.skills.map((s) => ({
          name: s.name ?? "",
          isPrimary: s.isPrimary ?? false,
          proficiency: s.proficiency ?? "Intermediate",
        }))
      : [{ ...EMPTY_SKILL }];

  const certifications =
    r.certifications?.length > 0
      ? r.certifications.map((c) => ({
          name: c.name ?? "",
          issuingOrg: c.issuingOrg ?? "",
          year: c.year ?? "",
          certificateUrl: c.certificateUrl ?? "",
        }))
      : [];

  const languages =
    r.languages?.length > 0
      ? r.languages.map((l) => ({
          language: l.language ?? "",
          proficiency: l.proficiency ?? "Intermediate",
        }))
      : [{ ...EMPTY_LANGUAGE }];

  let otherLinks = [];
  if (r.otherLinks) {
    try {
      otherLinks = JSON.parse(r.otherLinks);
      if (!Array.isArray(otherLinks)) otherLinks = [];
    } catch {
      otherLinks = [];
    }
  }

  return {
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    emailOverride:
      r.emailOverride != null && r.emailOverride !== "" ? r.emailOverride : userEmail,
    currentPosition: r.currentPosition ?? "",
    professionalHeadline: r.professionalHeadline ?? "",
    aboutMe: r.aboutMe ?? "",
    yearsExperience: r.yearsExperience ?? "",
    workExperiences: work,
    educations: edu,
    skills,
    certifications,
    languages,
    linkedInUrl: r.linkedInUrl ?? "",
    githubUrl: r.githubUrl ?? "",
    portfolioUrl: r.portfolioUrl ?? "",
    behanceUrl: r.behanceUrl ?? "",
    dribbbleUrl: r.dribbbleUrl ?? "",
    otherLinks,
    lookingFor: Array.isArray(r.lookingFor) ? r.lookingFor : [],
    preferredJobRole: r.preferredJobRole ?? "",
    preferredIndustry: r.preferredIndustry ?? "",
    workMode: r.workMode ?? "",
    noticePeriod: r.noticePeriod ?? "",
    noticePeriodCustom: r.noticePeriodCustom ?? "",
    expectedSalaryPackage: r.expectedSalaryPackage ?? "",
    currentSalaryPackage: r.currentSalaryPackage ?? "",
    currentSalaryVisibleToRecruiter: r.currentSalaryVisibleToRecruiter ?? false,
    salaryCurrency: r.salaryCurrency ?? "INR",
    salaryNegotiable: r.salaryNegotiable ?? false,
    hourlyRate: r.hourlyRate ?? "",
    dailyRate: r.dailyRate ?? "",
    projectRate: r.projectRate ?? "",
  };
}

export function formToApiPayload(form, userEmail = "") {
  return {
    firstName: form.firstName || null,
    lastName: form.lastName || null,
    emailOverride: form.emailOverride === userEmail ? null : form.emailOverride || null,
    currentPosition: form.currentPosition || null,
    professionalHeadline: form.professionalHeadline || null,
    aboutMe: form.aboutMe || null,
    yearsExperience: form.yearsExperience || null,
    workExperiences: form.workExperiences
      .filter(
        (w) =>
          w.companyName ||
          w.companyUrl ||
          w.position ||
          w.responsibilities ||
          w.duties ||
          w.keyAchievements ||
          w.startDate ||
          w.endDate ||
          w.year
      )
      .map((w) => ({
        companyName: w.companyName,
        companyUrl: w.companyUrl,
        position: w.position,
        responsibilities: w.responsibilities || w.duties,
        duties: w.responsibilities || w.duties,
        keyAchievements: w.keyAchievements,
        startDate: w.startDate,
        endDate: w.isCurrent ? null : w.endDate,
        isCurrent: w.isCurrent,
        employmentType: w.employmentType || null,
        year: w.year || (w.startDate ? w.startDate.slice(0, 4) : null),
      })),
    educations: form.educations
      .filter(
        (e) =>
          e.degree ||
          e.specialization ||
          e.universityName ||
          e.streamName ||
          e.marksOrScore ||
          e.startYear ||
          e.endYear ||
          e.yearOfPassing
      )
      .map((e) => ({
        degree: e.degree,
        specialization: e.specialization || e.streamName,
        universityName: e.universityName,
        streamName: e.streamName || e.specialization,
        marksOrScore: e.marksOrScore,
        startYear: e.startYear,
        endYear: e.endYear || e.yearOfPassing,
        yearOfPassing: e.endYear || e.yearOfPassing,
      })),
    skills: form.skills.filter((s) => s.name?.trim()),
    certifications: form.certifications.filter((c) => c.name?.trim()),
    languages: form.languages.filter((l) => l.language?.trim()),
    linkedInUrl: form.linkedInUrl || null,
    githubUrl: form.githubUrl || null,
    portfolioUrl: form.portfolioUrl || null,
    behanceUrl: form.behanceUrl || null,
    dribbbleUrl: form.dribbbleUrl || null,
    otherLinks: form.otherLinks?.length ? form.otherLinks : null,
    lookingFor: form.lookingFor,
    preferredJobRole: form.preferredJobRole || null,
    preferredIndustry: form.preferredIndustry || null,
    workMode: form.workMode || null,
    noticePeriod: form.noticePeriod || null,
    noticePeriodCustom: form.noticePeriodCustom || null,
    expectedSalaryPackage: form.expectedSalaryPackage || null,
    currentSalaryPackage: form.currentSalaryPackage || null,
    currentSalaryVisibleToRecruiter: form.currentSalaryVisibleToRecruiter,
    salaryCurrency: form.salaryCurrency || "INR",
    salaryNegotiable: form.salaryNegotiable,
    hourlyRate: form.hourlyRate || null,
    dailyRate: form.dailyRate || null,
    projectRate: form.projectRate || null,
  };
}
