do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'allowed_student_email_domains'
  ) then
    insert into public.allowed_student_email_domains (domain)
    values ('vitstudent.ac.in')
    on conflict (domain) do nothing;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'allowed_mentor_emails'
  ) then
    insert into public.allowed_mentor_emails (email, full_name, bio, tags)
    values
      (
        lower('mentor.ds@vit.ac.in'),
        'Aarav Menon',
        'Helps students compare analytics, ML engineering, and product-flavored data work.',
        array['Python', 'ML projects', 'Internships']
      ),
      (
        lower('mentor.cp@vit.ac.in'),
        'Sneha Iyer',
        'Useful for students deciding whether they genuinely enjoy algorithms or are following the crowd.',
        array['Graphs', 'Contests', 'Interview prep']
      ),
      (
        lower('mentor.core@vit.ac.in'),
        'Kavin Raj',
        'Bridges software-heavy paths with electronics, robotics, and systems design.',
        array['Embedded', 'Robotics', 'Design reviews']
      )
    on conflict (email) do update
    set
      full_name = excluded.full_name,
      bio = excluded.bio,
      tags = excluded.tags,
      is_active = true;
  end if;
end $$;
