export function formatResumeDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

export default function ViewResumeContent({ resume }) {
  if (!resume) return <p className="text-brand-text-weak">No resume data.</p>;

  let otherLinks = [];
  if (resume.otherLinks) {
    try {
      otherLinks = JSON.parse(resume.otherLinks);
    } catch {
      otherLinks = [];
    }
  }

  const name = [resume.firstName, resume.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-semibold text-brand-text-strong text-base">{name}</p>
        {resume.professionalHeadline && (
          <p className="text-brand mt-0.5">{resume.professionalHeadline}</p>
        )}
        {resume.emailOverride && (
          <p className="text-brand-text-weak mt-0.5">{resume.emailOverride}</p>
        )}
      </div>

      {resume.aboutMe && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">About</p>
          <p className="text-brand-text-weak whitespace-pre-wrap">{resume.aboutMe}</p>
        </div>
      )}

      {(resume.currentPosition || resume.yearsExperience) && (
        <div>
          {resume.currentPosition && (
            <p>
              <span className="font-medium">Position:</span> {resume.currentPosition}
            </p>
          )}
          {resume.yearsExperience && (
            <p>
              <span className="font-medium">Experience:</span> {resume.yearsExperience} years
            </p>
          )}
        </div>
      )}

      {resume.skills?.length > 0 && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Skills</p>
          <ul className="list-disc list-inside text-brand-text-weak">
            {resume.skills.map((s) => (
              <li key={s.id || s.name}>
                {s.name} — {s.proficiency}
                {s.isPrimary ? " (Primary)" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resume.workExperiences?.length > 0 && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Experience</p>
          {resume.workExperiences.map((w, i) => (
            <div key={w.id || i} className="mb-2 text-brand-text-weak">
              <p className="font-medium text-brand-text-strong">
                {w.position || "Role"} at {w.companyName || "Company"}
              </p>
              {(w.startDate || w.endDate || w.year) && (
                <p className="text-xs">
                  {w.startDate || w.year}
                  {w.isCurrent ? " – Present" : w.endDate ? ` – ${w.endDate}` : ""}
                </p>
              )}
              {w.employmentType && <p className="text-xs">{w.employmentType}</p>}
              {(w.responsibilities || w.duties) && (
                <p className="mt-1 whitespace-pre-wrap">{w.responsibilities || w.duties}</p>
              )}
              {w.keyAchievements && (
                <p className="mt-1 whitespace-pre-wrap">
                  <span className="font-medium">Achievements:</span> {w.keyAchievements}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {resume.educations?.length > 0 && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Education</p>
          {resume.educations.map((e, i) => (
            <div key={e.id || i} className="mb-2 text-brand-text-weak">
              <p className="font-medium text-brand-text-strong">
                {[e.degree, e.specialization || e.streamName].filter(Boolean).join(" in ")}
              </p>
              <p>{e.universityName}</p>
              {(e.startYear || e.endYear || e.yearOfPassing) && (
                <p className="text-xs">
                  {e.startYear}
                  {e.endYear || e.yearOfPassing ? ` – ${e.endYear || e.yearOfPassing}` : ""}
                </p>
              )}
              {e.marksOrScore && <p className="text-xs">Score: {e.marksOrScore}</p>}
            </div>
          ))}
        </div>
      )}

      {resume.certifications?.length > 0 && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Certifications</p>
          <ul className="list-disc list-inside text-brand-text-weak">
            {resume.certifications.map((c) => (
              <li key={c.id || c.name}>
                {c.name}
                {c.issuingOrg ? ` — ${c.issuingOrg}` : ""}
                {c.year ? ` (${c.year})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resume.languages?.length > 0 && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Languages</p>
          <ul className="list-disc list-inside text-brand-text-weak">
            {resume.languages.map((l) => (
              <li key={l.id || l.language}>
                {l.language} — {l.proficiency}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(resume.linkedInUrl ||
        resume.githubUrl ||
        resume.portfolioUrl ||
        resume.behanceUrl ||
        resume.dribbbleUrl ||
        otherLinks.length > 0) && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Links</p>
          <ul className="space-y-1 text-brand underline">
            {resume.linkedInUrl && (
              <li>
                <a href={resume.linkedInUrl} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
            )}
            {resume.githubUrl && (
              <li>
                <a href={resume.githubUrl} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            )}
            {resume.portfolioUrl && (
              <li>
                <a href={resume.portfolioUrl} target="_blank" rel="noopener noreferrer">
                  Portfolio
                </a>
              </li>
            )}
            {resume.behanceUrl && (
              <li>
                <a href={resume.behanceUrl} target="_blank" rel="noopener noreferrer">
                  Behance
                </a>
              </li>
            )}
            {resume.dribbbleUrl && (
              <li>
                <a href={resume.dribbbleUrl} target="_blank" rel="noopener noreferrer">
                  Dribbble
                </a>
              </li>
            )}
            {otherLinks.map((l, i) => (
              <li key={i}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label || l.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(resume.lookingFor?.length > 0 ||
        resume.preferredJobRole ||
        resume.workMode ||
        resume.noticePeriod) && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Job Preferences</p>
          {resume.lookingFor?.length > 0 && (
            <p className="text-brand-text-weak">Looking for: {resume.lookingFor.join(", ")}</p>
          )}
          {resume.preferredJobRole && (
            <p className="text-brand-text-weak">Role: {resume.preferredJobRole}</p>
          )}
          {resume.preferredIndustry && (
            <p className="text-brand-text-weak">Industry: {resume.preferredIndustry}</p>
          )}
          {resume.workMode && <p className="text-brand-text-weak">Work mode: {resume.workMode}</p>}
          {resume.noticePeriod && (
            <p className="text-brand-text-weak">
              Notice: {resume.noticePeriod}
              {resume.noticePeriodCustom ? ` (${resume.noticePeriodCustom})` : ""}
            </p>
          )}
        </div>
      )}

      {(resume.expectedSalaryPackage || resume.currentSalaryPackage) && (
        <div>
          <p className="font-medium text-brand-text-strong mb-1">Salary</p>
          {resume.expectedSalaryPackage && (
            <p className="text-brand-text-weak">
              Expected: {resume.salaryCurrency || "INR"} {resume.expectedSalaryPackage}
              {resume.salaryNegotiable ? " (Negotiable)" : ""}
            </p>
          )}
          {resume.currentSalaryPackage && resume.currentSalaryVisibleToRecruiter && (
            <p className="text-brand-text-weak">
              Current: {resume.salaryCurrency || "INR"} {resume.currentSalaryPackage}
            </p>
          )}
          {(resume.hourlyRate || resume.dailyRate || resume.projectRate) && (
            <p className="text-brand-text-weak text-xs mt-1">
              {[resume.hourlyRate && `Hourly: ${resume.hourlyRate}`, resume.dailyRate && `Daily: ${resume.dailyRate}`, resume.projectRate && `Project: ${resume.projectRate}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      {resume.resumeFilePath && (
        <p className="text-xs text-brand-text-weak">
          Resume file:{" "}
          <a href={resume.resumeFilePath} target="_blank" rel="noopener noreferrer" className="text-brand underline">
            Download
          </a>
        </p>
      )}
    </div>
  );
}
